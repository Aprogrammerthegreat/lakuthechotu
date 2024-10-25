import express from 'express';
import fetch from 'node-fetch';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = 3000;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/callback'
});

// Set up static folder and view engine
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Hugging Face API Details
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment';

// Function to analyze sentiment
async function analyzeSentiment(text) {
  try {
    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });

    const result = await response.json();
    const sentiment = result[0]?.label || 'neutral';
    return sentiment.toLowerCase();
  } catch (error) {
    console.error('Error during sentiment analysis:', error);
    return 'neutral';
  }
}

// Function to retrieve playlists based on sentiment
async function getMoodBasedPlaylist(sentiment) {
  const playlists = {
    positive: [
      'Happy Vibes', 'Good Times', 'Uplifting Beats'
    ],
    negative: [
      'Chill Songs', 'Calm Down', 'Reflective Moments'
    ],
    neutral: [
      'Easy Listening', 'Background Beats', 'Mellow Tunes'
    ]
  };

  try {
    const playlist = playlists[sentiment] || playlists['neutral'];
    return playlist;
  } catch (error) {
    console.error('Error retrieving playlist:', error);
    return playlists['neutral'];
  }
}

// Chatbot route to interact with user
app.post('/chat', async (req, res) => {
  const { query } = req.body;

  console.log('User query:', query);

  try {
    // Step 1: Analyze the user's mood
    const sentiment = await analyzeSentiment(query);
    console.log(`Detected mood: ${sentiment}`);

    // Step 2: Select a playlist based on mood
    const playlist = await getMoodBasedPlaylist(sentiment);

    // Step 3: Construct bot response based on sentiment
    let botMessage;
    if (sentiment === 'positive') {
      botMessage = `You seem in high spirits! 🎉 Here's a playlist to keep those vibes going: ${playlist.join(', ')}`;
    } else if (sentiment === 'negative') {
      botMessage = `It seems like things might be a bit rough. Here are some calming tunes to lift your spirits: ${playlist.join(', ')}`;
    } else {
      botMessage = `I sense a chill mood! Here are some mellow tunes for your vibe: ${playlist.join(', ')}`;
    }

    // Step 4: Send back the response with the playlist
    res.json({
      botMessage,
      playlist
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      botMessage: 'Sorry, something went wrong with mood detection.',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Sonify running on http://localhost:${PORT}`);
});
