import { router, db, auth, ai } from "@appdeploy/sdk";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://joewhfllvdaygffsosor.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQ1MTUsImV4cCI6MjA4OTA4MDUxNX0.r7UVrbONJGipYyvDgB5jHA4SA1jtgs0Vl9NEQbw8Nc4";
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check
router.get("/health", async (req) => {
    return { status: "healthy", environment: "production", version: "1.0.0" };
});

// Root
router.get("/", async (req) => {
    return { message: "SL Academy Platform API", version: "1.0.0" };
});

// --- TRACKS ---
router.get("/api/tracks", async (req) => {
    const { data, error } = await supabase.from("tracks").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
});

router.get("/api/tracks/:id", async (req) => {
    const { data, error } = await supabase.from("tracks").select("*").eq("id", req.params.id).single();
    if (error) throw new Error(error.message);
    return data;
});

// --- LESSONS ---
router.get("/api/lessons/tracks/:trackId/lessons", async (req) => {
    const { data, error } = await supabase.from("lessons").select("*").eq("track_id", req.params.trackId).order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
});

router.get("/api/lessons/:id", async (req) => {
    const { data, error } = await supabase.from("lessons").select("*").eq("id", req.params.id).single();
    if (error) throw new Error(error.message);
    return data;
});

// --- QUESTIONS ---
router.get("/api/lessons/:lessonId/questions", async (req) => {
    const type = req.query.type;
    let query = supabase.from("questions").select("*").eq("lesson_id", req.params.lessonId);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
});

// --- TEST ATTEMPTS ---
router.post("/api/test-attempts", async (req) => {
    const body = await req.json();
    const { data, error } = await supabase.from("test_attempts").insert(body).select().single();
    if (error) throw new Error(error.message);
    return data;
});

router.get("/api/test-attempts/lessons/:lessonId/attempts", async (req) => {
    const { data, error } = await supabase.from("test_attempts").select("*").eq("lesson_id", req.params.lessonId);
    if (error) throw new Error(error.message);
    return data;
});

// --- DOUBTS ---
router.get("/api/doubts", async (req) => {
    const { status, lesson_id } = req.query;
    let query = supabase.from("doubts").select("*");
    if (status) query = query.eq("status", status);
    if (lesson_id) query = query.eq("lesson_id", lesson_id);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
});

router.post("/api/doubts", async (req) => {
    const body = await req.json();
    const { data, error } = await supabase.from("doubts").insert(body).select().single();
    if (error) throw new Error(error.message);
    return data;
});

// --- INDICATORS ---
router.get("/api/indicators", async (req) => {
    const { category, startDate, endDate } = req.query;
    let query = supabase.from("indicators").select("*");
    if (category) query = query.eq("category", category);
    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query.order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
});

// --- AI (Recommendations) ---
router.post("/api/generate-recommendations", async (req) => {
    const { indicator_data, context } = await req.json();

    const prompt = `Based on the following hospital indicators: ${JSON.stringify(indicator_data)}. Context: ${context}. Generate 3 strategic recommendations.`;

    // Use AppDeploy native AI module
    const result = await ai.generate(prompt);

    return { recommendations: result.split('\n').filter(r => r.trim()) };
});

export const handler = router.handler;
