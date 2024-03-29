const express = require('express');
const router = express.Router()
const fs = require('fs');
const { users, videos } = require('../db')
const { google } = require('googleapis');
// const OAuth2 = google.auth.OAuth2;
const path = require('path');
const { authorize , authMiddleware} = require("./functions");

var cors = require('cors')

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    // Other CORS options...
}));
app.use(express.json());



router.get('/info',(req, res) => {
    const AnotherToken = req.headers['anothertoken'];
    const authHeader = req.headers['authorization'];

    console.log('\n\nanothertokrn :-', AnotherToken);
    console.log('\n\nauthtoken :-', authHeader);
    if(AnotherToken == "null"){
        console.log("redirected to signup")

       return  res.json({msg:"token is not set"});
    }
    if(authHeader ==="Bearer null"){
        return  res.json({msg:"youtube token is not set"});

    }
// console.log("\n\n hahahahah :-",AnotherToken)
// console.log("\n\n\n");
    fs.readFile('client_secret.json', (err, content) => {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        authorize(JSON.parse(content), res,authHeader, (oauth2Client) => {
            getChannel(oauth2Client, req, res);
        });
    });
});

function getChannel(auth, req, res) {
    const service = google.youtube('v3');
    service.channels.list({
        auth: auth,
        part: 'snippet,contentDetails,statistics',
        mine: true,
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            res.status(500).send('Error retrieving channel data');
            return;
        }
        const channels = response.data.items;
        if (!channels || channels.length == 0) {
            console.log('No channel found or empty response.');
            res.status(404).send('No channel found');
            return;
        }
        console.log(channels);
        console.log('This channel\'s ID is %s. Its title is \'%s\', and it has %s views.',
            channels[0].id,
            channels[0].snippet.title,
            channels[0].statistics.viewCount);
        console.log("Thumbnail: " + channels[0].snippet.thumbnails.default.url);

        
        // Get the uploads playlist ID from the content details
        const uploadsPlaylistId = channels[0].contentDetails.relatedPlaylists.uploads;
        console.log('Uploads Playlist ID:', uploadsPlaylistId);


        res.json({ channels: channels });
    });
}



router.get('/video',(req, res) => {
    const AnotherToken = req.headers['anothertoken'];
    const authHeader = req.headers['authorization'];

    console.log('\n\nanothertokrn :-', AnotherToken);
    console.log('\n\nauthtoken :-', authHeader);

    if(AnotherToken == "null"){
        console.log("redirected to signup")
       return  res.json({msg:"token is not set"});
    }
    if(authHeader === "Bearer null"){
        return  res.json({msg:"youtube token is not set"});

    }
    fs.readFile('client_secret.json', (err, content) => {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        authorize(JSON.parse(content), res,authHeader, (oauth2Client) =>{
            listUploadedVideos(oauth2Client, req, res);
        });
    });
});
function listUploadedVideos(auth, req,res) {
    const service = google.youtube('v3');
    service.playlistItems.list({
        auth: auth,
        part: 'snippet',
        playlistId: 'UUHPJBySDBJe0E4J5FagpBSg', // Replace with your uploads playlist ID
        maxResults: 10, // Maximum number of videos to retrieve
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            res.status(500).send('Error retrieving video data');
            return;
        }
        const videos = response.data.items;
        if (!videos || videos.length === 0) {
            console.log('No videos found.');
            res.status(404).send('No videos found');
            return;
        }
      
        const videoData = videos.map(video => ({
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.default.url,
            publishedAt: video.snippet.publishedAt,
            videoUrl: `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`
        }));

        res.json({ videos: videoData });
        
    });
}


router.post('/edited_video',async (req, res) => {

    const creatorstring = req.body.string;
console.log(creatorstring);
    const allvideos = await videos.find({
        creator_string : creatorstring
    }).select('-_id  -__v')

    console.log(allvideos)


    res.json({
        videodata : allvideos
    })

});

router.get('/thumbnails/:thumbnails', (req, res) => {
    try {
      const imageName = req.params.thumbnails;
      const imagePath = path.join(__dirname, '..', '/thumbnails', imageName); // Adjust the path as per your setup
  
      // Send the image file as a response
      console.log(imagePath)
      res.sendFile(imagePath);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.get('/video/:videoname', (req, res) => {
    try {
      const videoname = req.params.videoname.toString(); // Corrected parameter name
      const videoPath = path.join(__dirname, '..', '/videos', videoname); // Adjust the path as per your setup
  
      // Send the video file as a response
      console.log(videoPath);
      res.sendFile(videoPath);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
module.exports = router;
