// lib/daily/client.ts
export async function createDailyRoom() {
    try {
        const response = await fetch('/api/daily/create-room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to create video room');
        }

        const data = await response.json();
        return data.room;
    } catch (error) {
        console.error('Error creating Daily room:', error);
        throw error;
    }
}
