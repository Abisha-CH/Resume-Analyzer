CREATE TYPE "public"."resume_status" AS ENUM('pending', 'processing', 'analyzed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."analysis_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" varchar(320) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"image_url" text,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"analysis_credits" text DEFAULT '3' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"original_name" varchar(260) NOT NULL,
	"storage_path" text NOT NULL,
	"storage_url" text,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"target_job_title" varchar(200),
	"target_job_description" text,
	"status" "resume_status" DEFAULT 'pending' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"resume_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "analysis_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"overall_score" integer,
	"potential_score" integer,
	"grade" varchar(4),
	"better_than_percent" integer,
	"interview_chance_percent" integer,
	"score_data" jsonb,
	"issues_data" jsonb,
	"recommendations_data" jsonb,
	"keywords_data" jsonb,
	"sections_data" jsonb,
	"action_plan_data" jsonb,
	"ai_summary" text,
	"raw_response" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;