// Edge function for text-to-speech using Abena AI for Twi language

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "akua" } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ABENA_AI_API_KEY = Deno.env.get("ABENA_AI_API_KEY");
    if (!ABENA_AI_API_KEY) {
      throw new Error("ABENA_AI_API_KEY is not configured");
    }

    console.log("Generating Twi speech with Abena AI for text length:", text.length);
    
    const response = await fetch(
      "https://abena.mobobi.com/playground/api/v1/tts/synthesize/",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ABENA_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          voice: voice,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Abena AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert audio buffer to base64 in chunks to avoid stack overflow
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000; // 32KB chunks
    let binary = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binary);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
