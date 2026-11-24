"""Helpers for generating temporary passwords for admin-provisioned accounts."""

import secrets

# Unambiguous character sets (no 0/O, 1/l/I) so the password is easy to read,
# copy, and dictate to a user.
_LOWER = "abcdefghijkmnpqrstuvwxyz"
_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
_DIGITS = "23456789"
_SYMBOLS = "@#$%&*"
_ALL = _LOWER + _UPPER + _DIGITS + _SYMBOLS


def generate_temp_password(length: int = 12) -> str:
    """Generate a cryptographically-secure temporary password.

    Guarantees at least one lowercase, uppercase, digit, and symbol so it
    satisfies common password policies.
    """
    if length < 8:
        length = 8

    # One guaranteed character from each class, then fill the rest randomly.
    chars = [
        secrets.choice(_LOWER),
        secrets.choice(_UPPER),
        secrets.choice(_DIGITS),
        secrets.choice(_SYMBOLS),
    ]
    chars += [secrets.choice(_ALL) for _ in range(length - len(chars))]

    # Shuffle so the guaranteed characters aren't always in the same positions.
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)
