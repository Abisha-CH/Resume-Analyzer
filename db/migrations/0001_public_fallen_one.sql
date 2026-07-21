ALTER TYPE "public"."resume_status" ADD VALUE 'parsed' BEFORE 'analyzed';--> statement-breakpoint
CREATE TABLE "resume_contents" (
	"id" text PRIMARY KEY NOT NULL,
	"resume_id" text NOT NULL,
	"user_id" text NOT NULL,
	"extracted_text" text NOT NULL,
	"word_count" integer NOT NULL,
	"char_count" integer NOT NULL,
	"parser_version" varchar(100) NOT NULL,
	"parsed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_contents_resume_id_unique" UNIQUE("resume_id")
);
--> statement-breakpoint
ALTER TABLE "resume_contents" ADD CONSTRAINT "resume_contents_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_contents" ADD CONSTRAINT "resume_contents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;