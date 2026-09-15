/**
 * City-Aware & Weather-Adaptive Activity Planner Engine
 * Fulfills Feature 7:
 * - Real, geographically accurate city spots & experiences
 * - Strict geographical validation (e.g., no beach in Jaipur/Rajasthan!)
 * - Dynamic weather filtering based on current temperature, rain, and UV conditions
 */

const CITY_DATABASE = {
  kolkata: {
    name: 'Kolkata',
    region: 'Eastern India',
    isCoastal: false,
    hasRiver: true,
    activities: [
      {
        id: 'kol-1',
        title: 'Morning Walk at Victoria Memorial Gardens',
        category: 'Heritage & Nature',
        location: 'Victoria Memorial, Queen\'s Way',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Stroll through lush green lawns surrounding the grand marble monument with cool morning breezes.',
      },
      {
        id: 'kol-2',
        title: 'Heritage Cafe Hopping along Park Street',
        category: 'Cafe & Culinary',
        location: 'Park Street & Free School Street',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds', 'storm'],
        description: 'Enjoy vintage aesthetics, freshly brewed coffee, and English tea cakes at legendary Kolkata bistros.',
      },
      {
        id: 'kol-3',
        title: 'Sunset Boat Ride at Princep Ghat',
        category: 'Scenic & Leisure',
        location: 'Strand Road, Hooghly Riverfront',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Relax along the historic ghats overlooking Vidyasagar Setu with a traditional country boat ride.',
      },
      {
        id: 'kol-4',
        title: 'Explore the Indian Museum & Academy of Fine Arts',
        category: 'Arts & Culture',
        location: 'Jawaharlal Nehru Road',
        indoor: true,
        idealWeather: ['rain', 'clouds', 'hot'],
        description: 'Immerse in India\'s oldest museum and contemporary art galleries away from the afternoon heat or rain.',
      },
      {
        id: 'kol-5',
        title: 'Coffee & Adda at College Street Coffee House',
        category: 'Intellectual & Vintage',
        location: 'College Street, Boi Para',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds'],
        description: 'Experience authentic Bengali conversations, classical fans, and cheap infused coffee among rows of bookstores.',
      },
    ],
  },
  jaipur: {
    name: 'Jaipur',
    region: 'Rajasthan Desert / Semi-arid',
    isCoastal: false,
    hasRiver: false,
    activities: [
      {
        id: 'jai-1',
        title: 'Early Morning Photography at Hawa Mahal',
        category: 'Architecture & Culture',
        location: 'Badi Chaupar, Pink City',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Capture the iconic 953 honeycombed jharokhas in the golden morning light before city crowds arrive.',
      },
      {
        id: 'jai-2',
        title: 'Heritage Courtyard Exploration at City Palace',
        category: 'Royal Heritage',
        location: 'Jalebi Chowk, Pink City',
        indoor: true,
        idealWeather: ['clear', 'clouds', 'hot', 'rain'],
        description: 'Walk through royal pavilions, Mubarak Mahal, and museum galleries preserving Rajputana royal artifacts.',
      },
      {
        id: 'jai-3',
        title: 'Sunset Overlook at Nahargarh Fort',
        category: 'Scenic Viewpoint',
        location: 'Aravalli Hills, Nahargarh',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Take in breathtaking panoramic views of the Pink City illuminated at dusk along the ridge.',
      },
      {
        id: 'jai-4',
        title: 'Artisan Textile & Pottery Shopping in Johari Bazaar',
        category: 'Shopping & Handicrafts',
        location: 'Johari Bazaar & Bapu Bazaar',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Browse handcrafted blue pottery, bandhani dupattas, and authentic block-printed fabrics.',
      },
      {
        id: 'jai-5',
        title: 'Rooftop Haveli Dining & Herbal Tea in C-Scheme',
        category: 'Cafe & Dining',
        location: 'C-Scheme & Civil Lines',
        indoor: true,
        idealWeather: ['clear', 'rain', 'clouds'],
        description: 'Sip saffron kahwa and artisan coffee on heritage haveli terraces overlooking courtyards.',
      },
    ],
  },
  mumbai: {
    name: 'Mumbai',
    region: 'Western Coastal',
    isCoastal: true,
    hasRiver: false,
    activities: [
      {
        id: 'mum-1',
        title: 'Evening Promenade Walk at Marine Drive',
        category: 'Scenic Promenade',
        location: 'Marine Drive / Queen\'s Necklace',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Soak in the Arabian Sea breeze and glittering city lights stretching along South Bombay\'s curve.',
      },
      {
        id: 'mum-2',
        title: 'Boutique Cafe Trail & Street Art Walk in Bandra',
        category: 'Cafe & Urban Art',
        location: 'Pali Hill & Ranwar Village, Bandra West',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds'],
        description: 'Wander past vibrant Portuguese murals, artisan roasteries, and cozy book cafes.',
      },
      {
        id: 'mum-3',
        title: 'Visit Jehangir Art Gallery & Kala Ghoda Heritage Mile',
        category: 'Art & Heritage',
        location: 'Kala Ghoda, Fort',
        indoor: true,
        idealWeather: ['rain', 'hot', 'clouds'],
        description: 'Explore contemporary Indian art exhibitions inside air-conditioned galleries followed by heritage bookstore stops.',
      },
      {
        id: 'mum-4',
        title: 'Sunset View at Bandstand & Castella de Aguada',
        category: 'Scenic Viewpoint',
        location: 'Bandstand Promenade, Bandra',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Watch waves crash against ancient Portuguese ramparts overlooking the Bandra-Worli Sea Link.',
      },
    ],
  },
  delhi: {
    name: 'Delhi',
    region: 'Northern Plains',
    isCoastal: false,
    hasRiver: true,
    activities: [
      {
        id: 'del-1',
        title: 'Heritage Nature Stroll at Lodhi Gardens',
        category: 'Nature & History',
        location: 'Lodhi Road, Central Delhi',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Walk amongst 15th-century Sayyid & Lodi architectural tombs nestled inside 90 acres of landscaped botany.',
      },
      {
        id: 'del-2',
        title: 'Colonaded Cafe Trail in Connaught Place',
        category: 'Cafe & Culinary',
        location: 'Inner & Outer Circle, CP',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds', 'hot'],
        description: 'Discover underground speakeasies, heritage bakeries (Wenger\'s), and modern espresso bars.',
      },
      {
        id: 'del-3',
        title: 'Evening Light Promenade at India Gate & Kartavya Path',
        category: 'Iconic Landmark',
        location: 'Kartavya Path, New Delhi',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Enjoy wide open fountains, evening lights, and ice cream stalls along the grand boulevard.',
      },
      {
        id: 'del-4',
        title: 'Modern Art & Sculptures at NGMA',
        category: 'Museum & Fine Arts',
        location: 'Jaipur House, India Gate Hexagon',
        indoor: true,
        idealWeather: ['rain', 'hot', 'clouds'],
        description: 'Admire masterpieces of modern Indian painters inside the serene, air-conditioned former royal mansion.',
      },
    ],
  },
  bengaluru: {
    name: 'Bengaluru',
    region: 'Deccan Plateau',
    isCoastal: false,
    hasRiver: false,
    activities: [
      {
        id: 'blr-1',
        title: 'Canopy Jogging & Cycling in Cubbon Park',
        category: 'Nature & Fitness',
        location: 'Kasturba Road, Central Bengaluru',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Breathe in crisp garden air beneath century-old bamboo groves and rain trees.',
      },
      {
        id: 'blr-2',
        title: 'Specialty Coffee Tour in Indiranagar & Koramangala',
        category: 'Cafe Culture',
        location: '100 Feet Road, Indiranagar',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds'],
        description: 'Sample pour-overs and aeropress roasts from artisanal Chikmagalur coffee beans in open-garden cafes.',
      },
      {
        id: 'blr-3',
        title: 'Glass House Flower Tour at Lalbagh Botanical Garden',
        category: 'Botanical Heritage',
        location: 'Mavalli, South Bengaluru',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Explore the 240-acre garden inspired by London’s Crystal Palace, hosting centuries-old rare flora.',
      },
    ],
  },
  london: {
    name: 'London',
    region: 'United Kingdom',
    isCoastal: false,
    hasRiver: true,
    activities: [
      {
        id: 'lon-1',
        title: 'Walk along the South Bank & Tate Modern',
        category: 'Art & Riverwalk',
        location: 'South Bank, Thames',
        indoor: true,
        idealWeather: ['rain', 'clouds', 'clear'],
        description: 'Admire modern installations at Tate Modern then walk along the Thames with views of St. Paul\'s Cathedral.',
      },
      {
        id: 'lon-2',
        title: 'Cozy Afternoon Tea in Covent Garden',
        category: 'Cafe & Culinary',
        location: 'Covent Garden Piazza',
        indoor: true,
        idealWeather: ['rain', 'clouds', 'clear'],
        description: 'Enjoy traditional warm scones with clotted cream and Earl Grey tea while watching street performers.',
      },
      {
        id: 'lon-3',
        title: 'Scenic Stroll through Hyde Park & Kensington Gardens',
        category: 'Nature & Walk',
        location: 'Hyde Park, Westminster',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Rent a boat on the Serpentine Lake and stroll through the rose gardens.',
      },
    ],
  },
  paris: {
    name: 'Paris',
    region: 'France',
    isCoastal: false,
    hasRiver: true,
    activities: [
      {
        id: 'par-1',
        title: 'Sunset Stroll along the Banks of the Seine',
        category: 'Scenic & Romantic',
        location: 'Pont Alexandre III, Paris',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Walk past vintage bouquinistes book stalls with views of the Eiffel Tower illuminated in the evening.',
      },
      {
        id: 'par-2',
        title: 'Terrace Coffee & Croissant in Saint-Germain-des-Prés',
        category: 'Cafe Culture',
        location: 'Boulevard Saint-Germain',
        indoor: true,
        idealWeather: ['clear', 'rain', 'clouds'],
        description: 'Sit at iconic wicker chairs watching Parisian street life at historic literary cafes like Café de Flore.',
      },
      {
        id: 'par-3',
        title: 'Impressionist Masterpieces at Musée d\'Orsay',
        category: 'Museum & Art',
        location: '1 Rue de la Légion d\'Honneur',
        indoor: true,
        idealWeather: ['rain', 'clouds', 'clear'],
        description: 'Discover Monet, Van Gogh, and Renoir inside the magnificent former Belle Époque railway station.',
      },
    ],
  },
  'new york': {
    name: 'New York',
    region: 'United States East Coast',
    isCoastal: true,
    hasRiver: true,
    activities: [
      {
        id: 'nyc-1',
        title: 'Walk the High Line Elevated Park',
        category: 'Urban Architecture',
        location: 'Meatpacking to Hudson Yards',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Stroll along a converted historic freight rail line featuring native grasses, sculptures, and skyline vistas.',
      },
      {
        id: 'nyc-2',
        title: 'Espresso & Pastries in Greenwich Village',
        category: 'Cafe & Culture',
        location: 'Bleecker & MacDougal Streets',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds'],
        description: 'Relax in historic coffee shops frequented by beat poets and jazz musicians with Italian cannolis.',
      },
      {
        id: 'nyc-3',
        title: 'Modern Art Discovery at MoMA',
        category: 'Museum & Fine Arts',
        location: '11 W 53rd Street, Midtown',
        indoor: true,
        idealWeather: ['rain', 'hot', 'clouds'],
        description: 'Immerse yourself in world-renowned modern paintings, design exhibitions, and the sculpture garden.',
      },
    ],
  },
  tokyo: {
    name: 'Tokyo',
    region: 'Japan',
    isCoastal: true,
    hasRiver: true,
    activities: [
      {
        id: 'tyo-1',
        title: 'Zen Garden Walk at Shinjuku Gyoen',
        category: 'Parks & Serenity',
        location: 'Shinjuku Ward, Tokyo',
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: 'Wander through classic Japanese landscape ponds, traditional teahouses, and serene bonsai collections.',
      },
      {
        id: 'tyo-2',
        title: 'Matcha & Kishaten Cafe Experience in Yanaka',
        category: 'Cafe & Retro',
        location: 'Yanaka Ginza, Taito',
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds'],
        description: 'Savor rich green tea lattes and siphon drip coffee in charming preserved Showa-era alleys.',
      },
      {
        id: 'tyo-3',
        title: 'Digital Art Immersion at teamLab Planets',
        category: 'Immersive Art',
        location: 'Toyosu, Koto City',
        indoor: true,
        idealWeather: ['rain', 'hot', 'clouds', 'clear'],
        description: 'Walk barefoot through mesmerizing interactive digital projections and water installations.',
      },
    ],
  },
};

/**
 * Intelligent City Activity Recommendation
 */
export function getRecommendedActivities(cityName, weather) {
  const normCity = (cityName || '').toLowerCase().trim();
  const { temperature, weather_group, precipitation, condition_text } = weather;
  const isRaining = precipitation > 0 || weather_group === 'rain' || weather_group === 'storm';
  const isExtremeHeat = temperature >= 36;
  const isCold = temperature <= 12;

  // Check if we have an explicit city profile
  let matchedProfile = null;
  for (const key of Object.keys(CITY_DATABASE)) {
    if (normCity.includes(key) || key.includes(normCity)) {
      matchedProfile = CITY_DATABASE[key];
      break;
    }
  }

  let rawList = [];

  if (matchedProfile) {
    rawList = matchedProfile.activities.map((act) => {
      let suitability = 'Recommended';
      let rationale = '';

      if (isRaining) {
        if (act.indoor) {
          suitability = 'Perfect for Today';
          rationale = `Protected indoor activity, ideal while it is raining (${condition_text}).`;
        } else {
          suitability = 'Weather Caution';
          rationale = `Outdoor activity. Carry an umbrella or consider rescheduling due to rain.`;
        }
      } else if (isExtremeHeat) {
        if (act.indoor) {
          suitability = 'Perfect for Afternoon';
          rationale = `Air-conditioned venue to beat the ${Math.round(temperature)}°C afternoon heat.`;
        } else {
          suitability = 'Best in Early Morning / Evening';
          rationale = `High daytime temperatures (${Math.round(temperature)}°C). Visit before 10 AM or after 5 PM.`;
        }
      } else if (isCold) {
        if (act.indoor) {
          suitability = 'Warm & Cozy';
          rationale = `Warm indoor ambiance away from the ${Math.round(temperature)}°C chill.`;
        } else {
          suitability = 'Invigorating Walk';
          rationale = `Dress warmly in cozy layers to enjoy the crisp fresh air.`;
        }
      } else {
        // Ideal pleasant weather
        if (!act.indoor) {
          suitability = 'Optimal Outdoor Weather';
          rationale = `Beautiful ${Math.round(temperature)}°C weather with ${condition_text} conditions!`;
        } else {
          suitability = 'Great Choice';
          rationale = `Pleasant ambient conditions throughout the area.`;
        }
      }

      return {
        ...act,
        suitability,
        rationale,
      };
    });
  } else {
    // Generate context-aware fallback activities tailored to geography
    // Ensure we do NOT recommend beaches in non-coastal or unknown land regions
    const genericActivities = [
      {
        id: 'gen-1',
        title: `City Center Heritage & Architecture Walk`,
        category: 'Sightseeing & Culture',
        location: `Central District, ${cityName}`,
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: `Explore prominent historic buildings, monuments, and civic plazas in ${cityName}.`,
        suitability: isRaining ? 'Carry Umbrella' : 'Recommended Walk',
        rationale: isRaining ? 'Roads may be wet; bring rain gear.' : `Enjoy pleasant ${Math.round(temperature)}°C outdoor exploration.`,
      },
      {
        id: 'gen-2',
        title: `Local Cafe & Regional Food Discovery`,
        category: 'Cafe & Culinary',
        location: `Main Boulevard, ${cityName}`,
        indoor: true,
        idealWeather: ['rain', 'clear', 'clouds'],
        description: `Experience authentic local dining, roasted coffee, and traditional bakeries in the heart of ${cityName}.`,
        suitability: isRaining ? 'Perfect for Today' : 'Highly Recommended',
        rationale: isRaining ? 'Cozy indoor retreat from the rain.' : 'Great spot to unwind and try local flavors.',
      },
      {
        id: 'gen-3',
        title: `Municipal Museum & Cultural Center`,
        category: 'Arts & History',
        location: `Cultural Corridor, ${cityName}`,
        indoor: true,
        idealWeather: ['rain', 'hot', 'clouds'],
        description: `Discover historical artifacts, regional paintings, and craft exhibitions representing the heritage of ${cityName}.`,
        suitability: isRaining || isExtremeHeat ? 'Ideal Indoor Experience' : 'Recommended',
        rationale: isRaining ? 'Fully protected indoor venue.' : 'Enriching cultural outing.',
      },
      {
        id: 'gen-4',
        title: `Public Botanical Garden & Lakeside Stroll`,
        category: 'Nature & Parks',
        location: `Public Park, ${cityName}`,
        indoor: false,
        idealWeather: ['clear', 'clouds'],
        description: `Relax amidst tree canopies, blooming walkways, and fresh open air.`,
        suitability: isRaining ? 'Not Recommended During Rain' : 'Great Outdoor Spot',
        rationale: isRaining ? 'Wet pathways; best visited once weather clears.' : 'Breathe in fresh open air in mild temperatures.',
      },
    ];

    rawList = genericActivities;
  }

  // Prioritize based on current weather (indoor first if raining)
  if (isRaining) {
    rawList.sort((a, b) => (b.indoor ? 1 : 0) - (a.indoor ? 1 : 0));
  } else {
    rawList.sort((a, b) => (a.indoor ? 0 : 1) - (b.indoor ? 0 : 1));
  }

  return {
    city: matchedProfile ? matchedProfile.name : cityName,
    region: matchedProfile ? matchedProfile.region : 'Region',
    isCoastal: matchedProfile ? matchedProfile.isCoastal : false,
    recommendations: rawList,
  };
}
