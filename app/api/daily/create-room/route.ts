// app/api/daily/create-room/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const dailyApiKey = process.env.DAILY_API_KEY;

        if (!dailyApiKey) {
            return NextResponse.json(
                { error: 'Daily API key is not configured' },
                { status: 500 }
            );
        }

        // Create a unique room name
        const roomName = `interview-${Date.now()}`;

        // Create a room using Daily.co API
        const response = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${dailyApiKey}`,
            },
            body: JSON.stringify({
                name: roomName,
                properties: {
                    start_audio_off: false,
                    start_video_off: false,
                    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
                },
            }),
        });

        const data = await response.json();

        return NextResponse.json({ room: data });
    } catch (error) {
        console.error('Error creating Daily room:', error);
        return NextResponse.json(
            { error: 'Failed to create video room' },
            { status: 500 }
        );
    }
}
