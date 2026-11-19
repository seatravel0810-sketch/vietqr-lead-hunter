import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const limit = Math.min(Math.max(Number(body.limit) || 20, 5), 50);

    if (!query) {
      return NextResponse.json({ error: 'Vui lòng cung cấp từ khóa cần cào' }, { status: 400 });
    }

    const githubToken = (process.env.GITHUB_TOKEN || '').trim();
    const repoOwner = 'seatravel0810-sketch';
    const repoName = 'vietqr-lead-hunter';

    const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/on_demand_crawler.yml/dispatches`;

    const ghRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VietQR-Lead-Hunter-Client',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          query,
          limit: String(limit),
        },
      }),
    });

    if (ghRes.status === 204 || ghRes.status === 200) {
      return NextResponse.json({
        success: true,
        message: `Đã kích hoạt cỗ máy vệ tinh đám mây cào trực tiếp từ Google Maps cho "${query}".`,
        query,
        estimatedTimeSeconds: 25,
      });
    } else {
      const errText = await ghRes.text();
      console.error('[Crawl On-Demand] Lỗi kích hoạt GitHub Actions:', ghRes.status, errText);
      return NextResponse.json(
        { error: 'Không thể kích hoạt cỗ máy đám mây: ' + errText },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error('[Crawl On-Demand Error]', err);
    return NextResponse.json({ error: 'Lỗi server: ' + err.message }, { status: 500 });
  }
}
