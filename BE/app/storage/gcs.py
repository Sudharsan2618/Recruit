"""GCP Cloud Storage helper — upload, signed URLs, bucket operations."""

import os
from datetime import timedelta
from typing import Optional
from google.cloud import storage
from google.oauth2 import service_account
from google.auth.transport import requests as google_auth_requests
from app.config import settings

_gcs_client: Optional[storage.Client] = None


def get_gcs_client() -> storage.Client:
    """Get authenticated GCS client (lazy-init with service account)."""
    global _gcs_client
    if _gcs_client is not None:
        return _gcs_client
    creds_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    if creds_path and os.path.isfile(creds_path):
        credentials = service_account.Credentials.from_service_account_file(creds_path)
        _gcs_client = storage.Client(project=settings.GCS_PROJECT_ID, credentials=credentials)
    else:
        _gcs_client = storage.Client(project=settings.GCS_PROJECT_ID)
    return _gcs_client


def get_bucket(client: Optional[storage.Client] = None) -> storage.Bucket:
    """Get the configured GCS bucket."""
    client = client or get_gcs_client()
    return client.bucket(settings.GCS_BUCKET_NAME)


def _signing_credentials_kwargs(client: storage.Client) -> dict:
    """Extra kwargs for generate_signed_url so signing works on Cloud Run / GCE.

    A service-account JSON key carries a private key and can sign URLs locally,
    so no extra kwargs are needed. On Cloud Run / GCE the attached service
    account only provides an OAuth token (no private key), and local signing
    fails with "you need a private key to sign credentials". In that case we
    fall back to the IAM ``signBlob`` API by passing the service account email
    plus a freshly-refreshed access token.

    Requires the runtime service account to have the
    ``roles/iam.serviceAccountTokenCreator`` role on itself.
    """
    creds = client._credentials

    # Key-based service-account credentials can sign locally — nothing to add.
    if isinstance(creds, service_account.Credentials):
        return {}

    # Token-only credentials (compute_engine / impersonated / default on GCE):
    # sign via IAM signBlob. Refresh to ensure a valid token + resolved email.
    creds.refresh(google_auth_requests.Request())
    email = getattr(creds, "service_account_email", None) or getattr(
        creds, "signer_email", None
    )
    return {
        "service_account_email": email,
        "access_token": creds.token,
    }


def upload_file(
    source_path: str,
    destination_blob: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload a local file to GCS and return the public URL."""
    bucket = get_bucket()
    blob = bucket.blob(destination_blob)
    blob.upload_from_filename(source_path, content_type=content_type)
    blob.make_public()
    return blob.public_url


def upload_bytes(
    data: bytes,
    destination_blob: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload bytes to GCS and return the public URL."""
    bucket = get_bucket()
    blob = bucket.blob(destination_blob)
    blob.upload_from_string(data, content_type=content_type)
    blob.make_public()
    return blob.public_url


def get_signed_url(blob_name: str, expiration_minutes: int = 60) -> str:
    """Generate a time-limited signed URL for private content."""
    client = get_gcs_client()
    bucket = get_bucket(client)
    blob = bucket.blob(blob_name)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="GET",
        **_signing_credentials_kwargs(client),
    )


def delete_blob(blob_name: str):
    """Delete a blob from GCS."""
    bucket = get_bucket()
    blob = bucket.blob(blob_name)
    blob.delete()


def generate_signed_upload_url(
    blob_name: str,
    content_type: str = "application/octet-stream",
    expiration_minutes: int = 30,
) -> str:
    """Generate a V4 signed URL for direct browser PUT upload to GCS."""
    client = get_gcs_client()
    bucket = get_bucket(client)
    blob = bucket.blob(blob_name)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="PUT",
        content_type=content_type,
        **_signing_credentials_kwargs(client),
    )
