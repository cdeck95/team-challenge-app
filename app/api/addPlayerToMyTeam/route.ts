import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { Team } from "@/app/interfaces/Team";

export async function POST(req: NextRequest) {
  try {
    const { player, teamName } = await req.json();

    // List the blobs to find the unique URL for the team JSON file
    const { blobs } = await list();
    const teamBlob = blobs.find((blob) =>
      blob.pathname.startsWith(`myteam_${teamName}.json`)
    );

    if (!teamBlob) {
      throw new Error(`Team file for ${teamName} not found`);
    }

    const blobUrl = teamBlob.url;

    // Add a cache-busting query parameter
    const cacheBustingUrl = `${blobUrl}?timestamp=${Date.now()}`;

    // Fetch the existing team data
    const response = await fetch(cacheBustingUrl, { cache: "no-store" });
    const team: Team = await response.json();

    // Add the new player to the team's players array
    team.players.push(player);

    // Upload the updated team data back to the blob without adding a random suffix
    await put(`myteam_${teamName}.json`, JSON.stringify(team), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return NextResponse.json({ message: "Player added successfully", team });
  } catch (error: any) {
    console.error("Error adding player:", error);
    return NextResponse.json(
      { message: "Error adding player", error },
      { status: 500 }
    );
  }
}