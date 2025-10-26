import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, prescriptions, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Format prescription data with full details
    const prescriptionContext = prescriptions.map((p: any) => {
      let context = `\nPrescription: ${p.prescription_name || 'Unnamed prescription'}`;
      context += `\n  Uploaded: ${new Date(p.created_at).toLocaleDateString()}`;
      
      // Include medicines details if available
      if (p.medicines && Array.isArray(p.medicines)) {
        context += `\n  Medications:`;
        p.medicines.forEach((med: any) => {
          context += `\n    - ${med.name || 'Unknown medication'}`;
          if (med.dosage) context += ` | Dosage: ${med.dosage}`;
          if (med.frequency) context += ` | Frequency: ${med.frequency}`;
          if (med.duration) context += ` | Duration: ${med.duration}`;
          if (med.instructions) context += ` | Instructions: ${med.instructions}`;
        });
      }
      
      // Include notes if available
      if (p.notes) {
        context += `\n  Notes: ${p.notes}`;
      }
      
      return context;
    }).join('\n');

    // Build conversation messages
    const messages = [
      {
        role: "system",
        content: `You are a helpful medical assistant that answers questions about prescriptions. You have access to the user's complete prescription details:

${prescriptionContext}

Your role:
- Answer questions about specific medications, their dosages, frequencies, and instructions
- Explain potential drug interactions between medications
- Clarify usage instructions and timing
- Provide information about side effects and precautions
- Help with medication adherence strategies
- Answer questions about the medications' purposes and effects

IMPORTANT:
- Base your answers on the actual prescription data provided above
- If asked about a medication not in their prescriptions, clearly state that
- Always remind users to consult their healthcare provider for medical advice or concerns
- Be specific and reference their actual medications, dosages, and schedules
- If prescription data is incomplete, acknowledge this limitation

Be helpful, clear, and personalized in your responses.`
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in prescription-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
