// ============================================================================
// LMS + RECRUITMENT PLATFORM - MONGODB SCHEMA
// ============================================================================
// Author: Database Architecture Team
// Date: February 09, 2026
// Description: MongoDB collections for flexible/analytical data including
//              learning progress, xAPI statements, analytics, and real-time data.
// ============================================================================

// Switch to the database
use recruit_lms_db;

// ============================================================================
// COLLECTION 1: LEARNING PROGRESS
// ============================================================================
// Tracks granular student learning activities and progress

db.createCollection("learning_progress", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["student_id", "course_id", "activity_type", "timestamp"],
      properties: {
        student_id: {
          bsonType: "int",
          description: "References students.student_id in PostgreSQL"
        },
        course_id: {
          bsonType: "int",
          description: "References courses.course_id in PostgreSQL"
        },
        module_id: {
          bsonType: "int",
          description: "References modules.module_id in PostgreSQL"
        },
        lesson_id: {
          bsonType: "int",
          description: "References lessons.lesson_id in PostgreSQL"
        },
        activity_type: {
          enum: [
            "lesson_started",
            "lesson_completed",
            "video_watched",
            "video_paused",
            "video_seeked",
            "document_viewed",
            "audio_played",
            "quiz_started",
            "quiz_submitted",
            "flashcard_interaction",
            "note_taken",
            "resource_downloaded",
            "page_viewed",
            "course_enrolled",
            "course_completed"
          ],
          description: "Type of learning activity"
        },
        timestamp: {
          bsonType: "date",
          description: "When the activity occurred"
        },
        session_id: {
          bsonType: "string",
          description: "Browser session identifier"
        },
        
        // Activity-specific details
        details: {
          bsonType: "object",
          properties: {
            // Video details
            video_progress: {
              bsonType: "object",
              properties: {
                current_time_seconds: { bsonType: "int" },
                total_duration_seconds: { bsonType: "int" },
                percentage_watched: { bsonType: "double" },
                playback_rate: { bsonType: "double" },
                is_completed: { bsonType: "bool" }
              }
            },
            
            // Quiz details
            quiz_result: {
              bsonType: "object",
              properties: {
                quiz_id: { bsonType: "int" },
                attempt_id: { bsonType: "int" },
                score: { bsonType: "double" },
                percentage: { bsonType: "double" },
                passed: { bsonType: "bool" },
                time_taken_seconds: { bsonType: "int" },
                answers: {
                  bsonType: "array",
                  items: {
                    bsonType: "object",
                    properties: {
                      question_id: { bsonType: "int" },
                      selected_answer: { bsonType: "string" },
                      correct_answer: { bsonType: "string" },
                      is_correct: { bsonType: "bool" },
                      time_spent_seconds: { bsonType: "int" }
                    }
                  }
                }
              }
            },
            
            // Flashcard details
            flashcard_session: {
              bsonType: "object",
              properties: {
                deck_id: { bsonType: "int" },
                card_id: { bsonType: "int" },
                mastery_level: { bsonType: "int" }, // 0-5 (spaced repetition)
                is_correct: { bsonType: "bool" },
                response_time_ms: { bsonType: "int" },
                next_review_date: { bsonType: "date" }
              }
            },
            
            // General metrics
            time_spent_seconds: { bsonType: "int" },
            scroll_depth_percentage: { bsonType: "double" }
          }
        },
        
        // SCORM-specific data
        scorm_data: {
          bsonType: "object",
          properties: {
            cmi_core_lesson_status: { bsonType: "string" },
            cmi_core_lesson_location: { bsonType: "string" },
            cmi_core_score_raw: { bsonType: "double" },
            cmi_core_score_min: { bsonType: "double" },
            cmi_core_score_max: { bsonType: "double" },
            cmi_core_total_time: { bsonType: "string" },
            cmi_suspend_data: { bsonType: "string" }
          }
        },
        
        // Device info
        device_info: {
          bsonType: "object",
          properties: {
            device_type: { bsonType: "string" }, // desktop, mobile, tablet
            browser: { bsonType: "string" },
            os: { bsonType: "string" },
            screen_resolution: { bsonType: "string" }
          }
        }
      }
    }
  }
});

// Indexes for learning_progress
db.learning_progress.createIndex({ "student_id": 1, "timestamp": -1 });
db.learning_progress.createIndex({ "course_id": 1, "timestamp": -1 });
db.learning_progress.createIndex({ "lesson_id": 1 });
db.learning_progress.createIndex({ "activity_type": 1 });
db.learning_progress.createIndex({ "timestamp": -1 });
db.learning_progress.createIndex({ "session_id": 1 });
db.learning_progress.createIndex({ "student_id": 1, "course_id": 1 });

// ============================================================================
// COLLECTION 2: XAPI STATEMENTS
// ============================================================================
// Stores raw xAPI (Experience API) statements for comprehensive learning analytics

db.createCollection("xapi_statements", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["statement", "timestamp", "student_id"],
      properties: {
        student_id: {
          bsonType: "int",
          description: "References students.student_id in PostgreSQL"
        },
        timestamp: {
          bsonType: "date",
          description: "When the statement was recorded"
        },
        
        // Full xAPI statement following the spec
        statement: {
          bsonType: "object",
          required: ["actor", "verb", "object"],
          properties: {
            id: { bsonType: "string" }, // UUID
            
            actor: {
              bsonType: "object",
              properties: {
                objectType: { bsonType: "string" },
                name: { bsonType: "string" },
                mbox: { bsonType: "string" }, // mailto:email
                account: {
                  bsonType: "object",
                  properties: {
                    homePage: { bsonType: "string" },
                    name: { bsonType: "string" }
                  }
                }
              }
            },
            
            verb: {
              bsonType: "object",
              properties: {
                id: { bsonType: "string" }, // IRI
                display: { bsonType: "object" } // Language map
              }
            },
            
            object: {
              bsonType: "object",
              properties: {
                objectType: { bsonType: "string" }, // Activity, Agent, etc.
                id: { bsonType: "string" }, // Activity IRI
                definition: {
                  bsonType: "object",
                  properties: {
                    name: { bsonType: "object" },
                    description: { bsonType: "object" },
                    type: { bsonType: "string" }
                  }
                }
              }
            },
            
            result: {
              bsonType: "object",
              properties: {
                score: {
                  bsonType: "object",
                  properties: {
                    scaled: { bsonType: "double" },
                    raw: { bsonType: "double" },
                    min: { bsonType: "double" },
                    max: { bsonType: "double" }
                  }
                },
                success: { bsonType: "bool" },
                completion: { bsonType: "bool" },
                response: { bsonType: "string" },
                duration: { bsonType: "string" } // ISO 8601 duration
              }
            },
            
            context: {
              bsonType: "object",
              properties: {
                registration: { bsonType: "string" }, // UUID
                instructor: { bsonType: "object" },
                team: { bsonType: "object" },
                contextActivities: {
                  bsonType: "object",
                  properties: {
                    parent: { bsonType: "array" },
                    grouping: { bsonType: "array" },
                    category: { bsonType: "array" }
                  }
                },
                platform: { bsonType: "string" },
                language: { bsonType: "string" },
                extensions: { bsonType: "object" }
              }
            },
            
            timestamp: { bsonType: "string" }, // ISO 8601
            stored: { bsonType: "string" }, // ISO 8601
            authority: { bsonType: "object" }
          }
        },
        
        // Denormalized fields for faster querying
        verb_id: {
          bsonType: "string",
          description: "Denormalized verb ID for indexing"
        },
        object_id: {
          bsonType: "string",
          description: "Denormalized activity/object ID for indexing"
        },
        course_id: {
          bsonType: "int",
          description: "Denormalized course reference"
        }
      }
    }
  }
});

// Indexes for xapi_statements
db.xapi_statements.createIndex({ "student_id": 1, "timestamp": -1 });
db.xapi_statements.createIndex({ "verb_id": 1 });
db.xapi_statements.createIndex({ "object_id": 1 });
db.xapi_statements.createIndex({ "course_id": 1 });
db.xapi_statements.createIndex({ "timestamp": -1 });
db.xapi_statements.createIndex({ "statement.id": 1 }, { unique: true, sparse: true });

// ============================================================================
// COLLECTION 3: FLASHCARD PROGRESS
// ============================================================================
// Tracks spaced repetition data for flashcards

db.createCollection("flashcard_progress", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["student_id", "deck_id", "card_id"],
      properties: {
        student_id: {
          bsonType: "int",
          description: "References students.student_id in PostgreSQL"
        },
        deck_id: {
          bsonType: "int",
          description: "References flashcard_decks.deck_id in PostgreSQL"
        },
        card_id: {
          bsonType: "int",
          description: "References flashcards.flashcard_id in PostgreSQL"
        },
        
        // Spaced Repetition Algorithm Data (SM-2 or similar)
        mastery_level: {
          bsonType: "int",
          minimum: 0,
          maximum: 5,
          description: "0=New, 1-5=Increasing mastery"
        },
        ease_factor: {
          bsonType: "double",
          description: "Difficulty factor for scheduling"
        },
        interval_days: {
          bsonType: "int",
          description: "Days until next review"
        },
        next_review_date: {
          bsonType: "date",
          description: "When to show this card again"
        },
        
        // Stats
        total_reviews: {
          bsonType: "int",
          description: "Total number of times reviewed"
        },
        correct_reviews: {
          bsonType: "int",
          description: "Number of correct reviews"
        },
        streak: {
          bsonType: "int",
          description: "Current correct streak"
        },
        
        // Review History
        review_history: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              reviewed_at: { bsonType: "date" },
              response_quality: { bsonType: "int" }, // 0-5 rating
              response_time_ms: { bsonType: "int" },
              was_correct: { bsonType: "bool" }
            }
          }
        },
        
        first_reviewed_at: { bsonType: "date" },
        last_reviewed_at: { bsonType: "date" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// Indexes for flashcard_progress
db.flashcard_progress.createIndex({ "student_id": 1, "deck_id": 1 });
db.flashcard_progress.createIndex({ "student_id": 1, "card_id": 1 }, { unique: true });
db.flashcard_progress.createIndex({ "student_id": 1, "next_review_date": 1 });
db.flashcard_progress.createIndex({ "next_review_date": 1 });

// ============================================================================
// COLLECTION 4: ANALYTICS AGGREGATES
// ============================================================================
// Pre-computed aggregated data for faster dashboard loading

db.createCollection("analytics_aggregates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["report_type", "period_start", "data"],
      properties: {
        report_type: {
          enum: [
            // Platform-wide
            "daily_platform_summary",
            "weekly_platform_summary",
            "monthly_platform_summary",
            
            // Course analytics
            "course_daily_stats",
            "course_weekly_stats",
            "course_completion_funnel",
            
            // Student analytics
            "student_daily_activity",
            "student_weekly_progress",
            
            // Job analytics
            "job_daily_stats",
            "job_application_funnel",
            
            // Company analytics
            "company_hiring_stats",
            
            // Revenue analytics
            "daily_revenue",
            "monthly_revenue_breakdown"
          ]
        },
        
        period_start: {
          bsonType: "date",
          description: "Start of the aggregation period"
        },
        period_end: {
          bsonType: "date",
          description: "End of the aggregation period"
        },
        
        // Entity reference (optional, for entity-specific reports)
        entity_type: {
          bsonType: "string"
        },
        entity_id: {
          bsonType: "int"
        },
        
        // Aggregated data (structure varies by report_type)
        data: {
          bsonType: "object"
        },
        
        // Metadata
        computed_at: {
          bsonType: "date"
        },
        is_stale: {
          bsonType: "bool"
        }
      }
    }
  }
});

// Indexes for analytics_aggregates
db.analytics_aggregates.createIndex({ "report_type": 1, "period_start": -1 });
db.analytics_aggregates.createIndex({ "report_type": 1, "entity_type": 1, "entity_id": 1 });
db.analytics_aggregates.createIndex({ "period_start": -1 });
db.analytics_aggregates.createIndex({ "computed_at": -1 });

// ============================================================================
// COLLECTION 5: USER SESSIONS
// ============================================================================
// Tracks user sessions for analytics and security

db.createCollection("user_sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "session_id", "started_at"],
      properties: {
        user_id: {
          bsonType: "int",
          description: "References users.user_id in PostgreSQL"
        },
        session_id: {
          bsonType: "string",
          description: "Unique session identifier"
        },
        
        // Timing
        started_at: { bsonType: "date" },
        ended_at: { bsonType: "date" },
        last_activity_at: { bsonType: "date" },
        duration_seconds: { bsonType: "int" },
        
        // Device & Location
        device_info: {
          bsonType: "object",
          properties: {
            device_type: { bsonType: "string" },
            browser: { bsonType: "string" },
            browser_version: { bsonType: "string" },
            os: { bsonType: "string" },
            os_version: { bsonType: "string" },
            screen_width: { bsonType: "int" },
            screen_height: { bsonType: "int" }
          }
        },
        
        location_info: {
          bsonType: "object",
          properties: {
            ip_address: { bsonType: "string" },
            country: { bsonType: "string" },
            city: { bsonType: "string" },
            timezone: { bsonType: "string" }
          }
        },
        
        // Activity Summary
        pages_visited: { bsonType: "int" },
        actions_performed: { bsonType: "int" },
        
        // Session Status
        is_active: { bsonType: "bool" },
        logout_type: {
          enum: ["manual", "timeout", "forced", null]
        }
      }
    }
  }
});

// Indexes for user_sessions
db.user_sessions.createIndex({ "user_id": 1, "started_at": -1 });
db.user_sessions.createIndex({ "session_id": 1 }, { unique: true });
db.user_sessions.createIndex({ "is_active": 1 });
db.user_sessions.createIndex({ "started_at": -1 });

// TTL index to auto-delete old sessions after 90 days
db.user_sessions.createIndex(
  { "ended_at": 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);

// ============================================================================
// COLLECTION 6: RESUME ANALYSIS
// ============================================================================
// Stores parsed resume data for better embeddings and matching

db.createCollection("resume_analysis", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["student_id", "analyzed_at"],
      properties: {
        student_id: {
          bsonType: "int",
          description: "References students.student_id in PostgreSQL"
        },
        
        // Source
        resume_url: {
          bsonType: "string",
          description: "S3 URL of the analyzed resume"
        },
        resume_hash: {
          bsonType: "string",
          description: "Hash to detect changes"
        },
        
        // Extracted Data
        extracted_skills: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              skill_name: { bsonType: "string" },
              confidence: { bsonType: "double" },
              matched_skill_id: { bsonType: "int" } // PostgreSQL skill_id if matched
            }
          }
        },
        
        extracted_education: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              institution: { bsonType: "string" },
              degree: { bsonType: "string" },
              field_of_study: { bsonType: "string" },
              start_date: { bsonType: "string" },
              end_date: { bsonType: "string" },
              gpa: { bsonType: "string" }
            }
          }
        },
        
        extracted_experience: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              company: { bsonType: "string" },
              title: { bsonType: "string" },
              location: { bsonType: "string" },
              start_date: { bsonType: "string" },
              end_date: { bsonType: "string" },
              is_current: { bsonType: "bool" },
              description: { bsonType: "string" },
              skills_used: { bsonType: "array" }
            }
          }
        },
        
        extracted_projects: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              name: { bsonType: "string" },
              description: { bsonType: "string" },
              technologies: { bsonType: "array" },
              url: { bsonType: "string" }
            }
          }
        },
        
        extracted_certifications: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              name: { bsonType: "string" },
              issuer: { bsonType: "string" },
              date: { bsonType: "string" }
            }
          }
        },
        
        // Summary
        total_experience_years: { bsonType: "double" },
        highest_education: { bsonType: "string" },
        
        // Metadata
        analyzed_at: { bsonType: "date" },
        analyzer_version: { bsonType: "string" },
        analysis_confidence: { bsonType: "double" }
      }
    }
  }
});

// Indexes for resume_analysis
db.resume_analysis.createIndex({ "student_id": 1 }, { unique: true });
db.resume_analysis.createIndex({ "analyzed_at": -1 });
db.resume_analysis.createIndex({ "extracted_skills.skill_name": 1 });

// ============================================================================
// COLLECTION 7: SEARCH LOGS
// ============================================================================
// Tracks search queries for analytics and improving recommendations

db.createCollection("search_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["search_type", "query", "searched_at"],
      properties: {
        user_id: {
          bsonType: "int",
          description: "Can be null for anonymous searches"
        },
        user_type: {
          enum: ["student", "company", "admin", null]
        },
        
        search_type: {
          enum: ["course", "job", "student", "material", "general"]
        },
        query: {
          bsonType: "string"
        },
        
        // Filters applied
        filters: {
          bsonType: "object"
        },
        
        // Results
        results_count: { bsonType: "int" },
        clicked_results: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              result_id: { bsonType: "int" },
              position: { bsonType: "int" },
              clicked_at: { bsonType: "date" }
            }
          }
        },
        
        // Timing
        searched_at: { bsonType: "date" },
        response_time_ms: { bsonType: "int" },
        
        // Session
        session_id: { bsonType: "string" }
      }
    }
  }
});

// Indexes for search_logs
db.search_logs.createIndex({ "search_type": 1, "searched_at": -1 });
db.search_logs.createIndex({ "query": "text" });
db.search_logs.createIndex({ "user_id": 1 });
db.search_logs.createIndex({ "searched_at": -1 });

// TTL index to auto-delete old search logs after 180 days
db.search_logs.createIndex(
  { "searched_at": 1 },
  { expireAfterSeconds: 15552000 } // 180 days
);

// ============================================================================
// COLLECTION 8: REAL-TIME NOTIFICATIONS QUEUE
// ============================================================================
// For real-time notification delivery (works with PostgreSQL notifications table)

db.createCollection("notification_queue", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "notification_type", "payload", "created_at"],
      properties: {
        user_id: {
          bsonType: "int"
        },
        notification_type: {
          bsonType: "string"
        },
        payload: {
          bsonType: "object"
        },
        
        // Delivery status
        is_delivered: { bsonType: "bool" },
        delivered_at: { bsonType: "date" },
        delivery_attempts: { bsonType: "int" },
        
        // Channel preference
        channels: {
          bsonType: "array",
          items: {
            enum: ["in_app", "email", "push", "sms"]
          }
        },
        
        created_at: { bsonType: "date" },
        expires_at: { bsonType: "date" }
      }
    }
  }
});

// Indexes for notification_queue
db.notification_queue.createIndex({ "user_id": 1, "is_delivered": 1 });
db.notification_queue.createIndex({ "created_at": -1 });

// TTL index to auto-delete delivered notifications after 7 days
db.notification_queue.createIndex(
  { "delivered_at": 1 },
  { expireAfterSeconds: 604800, partialFilterExpression: { is_delivered: true } }
);

// ============================================================================
// COLLECTION 9: EVENT LOG (for Event-Driven Architecture)
// ============================================================================
// Stores events for the event bus / async processing

db.createCollection("event_log", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["event_type", "payload", "created_at"],
      properties: {
        event_type: {
          enum: [
            "job.created",
            "job.updated",
            "job.closed",
            "student.profile.updated",
            "student.course.completed",
            "student.skill.added",
            "student.resume.uploaded",
            "student.job.applied",
            "admin.job.forwarded",
            "admin.recommendation.generated",
            "company.job.posted",
            "company.candidate.reviewed",
            "payment.completed",
            "webinar.registration",
            "mentor.session.booked"
          ]
        },
        
        payload: {
          bsonType: "object"
        },
        
        // Processing status
        status: {
          enum: ["pending", "processing", "completed", "failed"]
        },
        processed_at: { bsonType: "date" },
        error_message: { bsonType: "string" },
        retry_count: { bsonType: "int" },
        
        // Source
        source_service: { bsonType: "string" },
        correlation_id: { bsonType: "string" },
        
        created_at: { bsonType: "date" }
      }
    }
  }
});

// Indexes for event_log
db.event_log.createIndex({ "event_type": 1, "status": 1 });
db.event_log.createIndex({ "status": 1, "created_at": 1 });
db.event_log.createIndex({ "correlation_id": 1 });
db.event_log.createIndex({ "created_at": -1 });

// TTL index to auto-delete completed events after 30 days
db.event_log.createIndex(
  { "processed_at": 1 },
  { expireAfterSeconds: 2592000, partialFilterExpression: { status: "completed" } }
);

// ============================================================================
// COLLECTION 10: COURSE ENGAGEMENT HEATMAPS
// ============================================================================
// Aggregated engagement data for content optimization

db.createCollection("course_engagement", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["course_id", "lesson_id"],
      properties: {
        course_id: { bsonType: "int" },
        lesson_id: { bsonType: "int" },
        
        // Engagement metrics
        total_views: { bsonType: "int" },
        unique_viewers: { bsonType: "int" },
        avg_time_spent_seconds: { bsonType: "double" },
        completion_rate: { bsonType: "double" },
        drop_off_rate: { bsonType: "double" },
        
        // Video-specific (if applicable)
        video_heatmap: {
          bsonType: "array",
          description: "Array of engagement percentages per video segment",
          items: {
            bsonType: "object",
            properties: {
              segment_start_seconds: { bsonType: "int" },
              segment_end_seconds: { bsonType: "int" },
              view_count: { bsonType: "int" },
              avg_replays: { bsonType: "double" }
            }
          }
        },
        
        // Drop-off points
        drop_off_points: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              timestamp_seconds: { bsonType: "int" },
              drop_off_count: { bsonType: "int" }
            }
          }
        },
        
        // Quiz performance (for quiz lessons)
        quiz_stats: {
          bsonType: "object",
          properties: {
            total_attempts: { bsonType: "int" },
            avg_score: { bsonType: "double" },
            pass_rate: { bsonType: "double" },
            question_difficulty: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  question_id: { bsonType: "int" },
                  correct_rate: { bsonType: "double" },
                  avg_time_seconds: { bsonType: "double" }
                }
              }
            }
          }
        },
        
        last_updated: { bsonType: "date" }
      }
    }
  }
});

// Indexes for course_engagement
db.course_engagement.createIndex({ "course_id": 1 });
db.course_engagement.createIndex({ "lesson_id": 1 }, { unique: true });
db.course_engagement.createIndex({ "completion_rate": -1 });
db.course_engagement.createIndex({ "drop_off_rate": -1 });

// ============================================================================
// END OF MONGODB SCHEMA
// ============================================================================

print("MongoDB schema created successfully!");
print("Collections created:");
print("- learning_progress");
print("- xapi_statements");
print("- flashcard_progress");
print("- analytics_aggregates");
print("- user_sessions");
print("- resume_analysis");
print("- search_logs");
print("- notification_queue");
print("- event_log");
print("- course_engagement");
