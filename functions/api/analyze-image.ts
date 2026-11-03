// Cloudflare Pages Functions: POST /api/analyze-image

interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'サーバー側にGEMINI_API_KEYが設定されていません。アプリ内の設定画面から個人の無料APIキーをご設定いただくか、手入力・デモモードをご利用ください。',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = (await context.request.json()) as { imageBase64?: string };
    if (!body || !body.imageBase64) {
      return new Response(JSON.stringify({ error: '画像データが送信されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 画像サイズ制限 (5MB以上のBase64は拒絶)
    if (body.imageBase64.length > 7 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '画像サイズが大きすぎます' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
あなたは店頭商品棚・値札の画像解析AIです。写っている商品と値札を読み取り、以下のJSON形式で出力してください。
[
  {
    "name": "商品名",
    "brand": "ブランド名",
    "category": "調味料・油|麺類・パスタ|米・パン・粉類|肉・魚|野菜・果物|乳製品・卵|飲料・お茶|菓子・スナック|冷凍食品|レトルト・缶詰|日用品・消耗品|その他",
    "amount": 数値,
    "unit": "g|kg|ml|L|個|本|パック|枚",
    "price": 数値,
    "isTaxIncluded": false,
    "taxRate": 8,
    "confidence": 0.95,
    "features": "特徴",
    "priceTagText": "値札テキスト",
    "status": "confirmed または needs_check"
  }
]
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: body.imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: `Gemini API Error: ${err}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
    const parsed = JSON.parse(match[1] || text);

    return new Response(JSON.stringify({ products: parsed }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || '内部エラーが発生しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
