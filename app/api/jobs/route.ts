import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Job, JobCommitment } from '@/types/job'

// Function to generate a cool two-word name
function generateCoolName(): string {
  const adjectives = [
    'Cosmic', 'Quantum', 'Nebula', 'Stellar', 'Galactic', 
    'Digital', 'Cyber', 'Neon', 'Pixel', 'Binary',
    'Mystic', 'Ethereal', 'Celestial', 'Lunar', 'Solar',
    'Phantom', 'Shadow', 'Stealth', 'Ninja', 'Rogue',
    'Cosmic', 'Astral', 'Void', 'Nova', 'Pulse'
  ]
  
  const nouns = [
    'Explorer', 'Voyager', 'Pioneer', 'Nomad', 'Wanderer',
    'Coder', 'Hacker', 'Builder', 'Creator', 'Maker',
    'Phantom', 'Ghost', 'Spirit', 'Soul', 'Shadow',
    'Dragon', 'Phoenix', 'Griffin', 'Unicorn', 'Pegasus',
    'Ninja', 'Samurai', 'Ronin', 'Knight', 'Paladin'
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${randomAdjective} ${randomNoun}`
}

// Function to get a random Pokémon avatar URL
function getRandomPokemonAvatar(): string {
  // List of popular and cool-looking Pokémon IDs
  const coolPokemonIds = [
    6,  // Charizard
    9,  // Blastoise
    25, // Pikachu
    38, // Ninetales
    59, // Arcanine
    65, // Alakazam
    94, // Gengar
    130, // Gyarados
    131, // Lapras
    143, // Snorlax
    149, // Dragonite
    150, // Mewtwo
    151, // Mew
    196, // Espeon
    197, // Umbreon
    248, // Tyranitar
    249, // Lugia
    250, // Ho-Oh
    251, // Celebi
    384, // Rayquaza
    445, // Garchomp
    448, // Lucario
    483, // Dialga
    484, // Palkia
    487, // Giratina
    493, // Arceus
    643, // Reshiram
    644, // Zekrom
    646, // Kyurem
    716, // Xerneas
    717, // Yveltal
    718, // Zygarde
    800, // Necrozma
    888, // Zacian
    889, // Zamazenta
    890, // Eternatus
    891, // Kubfu
    892, // Urshifu
    893, // Zarude
    894, // Regieleki
    895, // Regidrago
    896, // Glastrier
    897, // Spectrier
    898, // Calyrex
  ]

  const randomId = coolPokemonIds[Math.floor(Math.random() * coolPokemonIds.length)]
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randomId}.png`
}

interface JobResponse {
  id: string
  title: string
  description: string
  location: string | null
  created_at: string
  skills_needed: string[]
  commitment: string
  user_id: string
  creator: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set() { /* Not needed in API route */ },
          remove() { /* Not needed in API route */ },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Log for debugging
    console.log("Session found:", session.user.id);

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const from = page * 10
    const to = from + 9

    const { data: jobs, error: jobsError } = await supabase
      .from('partner_jobs')
      .select(`
        id,
        title,
        description,
        location,
        created_at,
        skills_needed,
        commitment,
        user_profile_id,
        creator:user_profiles!partner_jobs_user_profile_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to) as { data: JobResponse[] | null, error: any }

    if (jobsError) {
      console.error('[Jobs API] Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: jobsError.message || 'Failed to load jobs' },
        { status: 500 }
      )
    }

    // Transform the data to match our Job type
    const transformedData = (jobs?.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      created_at: job.created_at,
      skills_needed: job.skills_needed || [],
      commitment: job.commitment as JobCommitment,
      creator: {
        full_name: job.creator?.full_name || 'Emotional Monkey',
        avatar_url: job.creator?.avatar_url || null
      }
    })) || []) satisfies Job[]

    return NextResponse.json({
      jobs: transformedData,
      hasMore: jobs?.length === 10
    })
  } catch (error) {
    console.error("Error in GET /api/jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set() { /* Not needed in API route */ },
          remove() { /* Not needed in API route */ },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Log for debugging
    console.log("Session found:", session.user.id);

    const json = await request.json();
    console.log('[Jobs API POST] Request body:', {
      title: json.title,
      description: json.description?.substring(0, 50) + '...',
      skillsCount: json.skills_needed?.length,
      commitment: json.commitment,
      resourceLinksCount: json.resource_links?.length
    });

    // Insert the job
    console.log('[Jobs API POST] Inserting job...');
    const { error: insertError } = await supabase
      .from('partner_jobs')
      .insert([{
        ...json,
        user_profile_id: session.user.id,
        status: 'active'
      }]);

    if (insertError) {
      console.error('[Jobs API POST] Insert error:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    console.log('[Jobs API POST] Job created successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 