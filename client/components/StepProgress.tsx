import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StepProgressType } from '@this/types/StepProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import useTheme from "@mui/material/styles/useTheme";
import Box from '@mui/material/Box';
import { VisuallyHiddenInput } from '../styling/createJourneyStyle';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import Button from '@mui/material/Button';


import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import MarkerEntity from './ARSteps';



type IHeaderProps = {
  userId: number
  step: StepProgressType
  userLat: number;
  userLong: number;
  accuracy: number;
  handleJourneyClick: (journeyId: number) => Promise<void>
};

const StepProgress: React.FC<IHeaderProps> = ({step, userLat, userLong, userId, accuracy, handleJourneyClick}) => {
  const [image, setImage] = useState<string | null | ArrayBuffer>(null)
  const [closeEnough, setCloseEnough] = useState(false)
  const [sizeWarning, setSizeWarning] = useState<boolean>(false)
  const [inProgress, setInProgress] = useState<boolean>(step.in_progress)
  const theme = useTheme();
  let deviceType;

  // Function to assess for IOS devices
  const  getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
     if (/iPad|iPhone/.test(userAgent)) {
      return 'iOS Device';
    } else if (/Macintosh|Mac OS X/.test(userAgent)) {
      return 'Macintosh';
    }
  }
  // Assignment of device type
  useEffect(() => {
     deviceType = getDeviceInfo() || '';
     //remove to see device type in console
    console.log('Device Type:', deviceType);
  }, []);

  const solveStep = async(e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = await new FileReader()
    reader.addEventListener('load', (event) => {
      axios.post(`/cloud/stepProgress/${step.id}`, {data: event.target.result})
        .then((response) => {
          axios.put(`/step/progress/${step.id}`, {
            in_progress: false,
            image_url: response.data.secure_url
          })
          setImage(response.data.secure_url)
        })
    });
    reader.readAsDataURL(e.target.files[0]);
}


  // Increment steps taken in user data
  const giveStepsTakenAchievement = async () => {

    const userDataResponse = await axios.get(`/userdata/byUserId/${userId}`);
    const existingUserData = userDataResponse.data;
    const updatedUserData = {
      ...existingUserData,
      stepsTaken: existingUserData.stepsTaken + 1, // Increment stepsTaken by 1
    };
    await axios.put(`/userdata/${existingUserData.id}`, updatedUserData);

    // Check for achievements if the user has any
    const userAchievementsResponse = await axios.get(`/userachievements/byUserId/${userId}`);
    const userAchievements = userAchievementsResponse.data;

    // Function to create a new user achievement if it doesn't exist
    const createNewUserAchievement = async (achievementId: number) => {
      await axios.post('/userachievements', {
        user: { id: userId },
        achievement: { id: achievementId },
      });
    };
    // Check if the user needs an achievement based on steps taken
    if (updatedUserData.stepsTaken >= 5) {
      if (Array.isArray(userAchievements)) {
        // Check if the user has achievement ID for steps taken
        const achievementId = 10;
        const hasAchievement = userAchievements.some(
          (achievement) => achievement.achievement.id === achievementId
        );
        // If they don't have it, create a new user achievement
        if (!hasAchievement) {
          createNewUserAchievement(achievementId);
        }
      }
    }

    if (updatedUserData.stepsTaken >= 25) {
      if (Array.isArray(userAchievements)) {
        // Check if the user has achievement ID for steps taken
        const achievementId = 11;
        const hasAchievement = userAchievements.some(
          (achievement) => achievement.achievement.id === achievementId
        );
        // If they don't have it, create a new user achievement
        if (!hasAchievement) {
          createNewUserAchievement(achievementId);
        }
      }
    }

    if (updatedUserData.stepsTaken >= 50) {
      if (Array.isArray(userAchievements)) {
        // Check if the user has achievement ID for steps taken
        const achievementId = 12;
        const hasAchievement = userAchievements.some(
          (achievement) => achievement.achievement.id === achievementId
        );
        // If they don't have it, create a new user achievement
        if (!hasAchievement) {
          createNewUserAchievement(achievementId);
        }
      }
    }
  };

  const getLocation = () => {
    let feetAcc = accuracy * 3.28084 * 1.05
    const feetPerDegree = 364000;

    const latDiff = Math.abs(Number(step.step.latitude) - userLat);
    const lonDiff = Math.abs(Number(step.step.longitude) - userLong);

    const distanceInFeet = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * feetPerDegree;

    if(distanceInFeet < 20 + feetAcc) {
      setCloseEnough(true);
    } else {
      setCloseEnough(false);
    }

 }

  useEffect(() => {
    getLocation()

  }, [userLat, userLong])


   /**Text to Speech Functionality */
   const synth = window.speechSynthesis
   const voices = synth.getVoices();
   const [text, setText] = useState<string>(step.step.hint);
   const [chosenVoice, setChosenVoice] = useState<SpeechSynthesisVoice>(voices[4]);

   useEffect(() => {
    setChosenVoice(voices[4]);
   }, [chosenVoice])

   const speakText = () => {
     if (synth) {
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.voice = chosenVoice;
       synth.speak(utterance);
     }
   }

  return (
    <Card
      sx={{
        padding: '10px',
        background: '#f8e5c8',
        borderRadius: '16px',
        boxShadow: '5px 5px 15px 0px #a0a0a0, -5px -5px 15px 0px #ffffff',
        border: '1px solid #9a4119',
        margin: '10px',
      }}>
      {!inProgress ?
        (<CardMedia
        sx={{
          height: 300,
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: theme.shape.borderRadius,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        image={step.image_url || image }
        />) :
        (<CardContent
        sx={{
          // border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: theme.shape.borderRadius,
          margin: `${theme.spacing(1)} 0`,
          padding: theme.spacing(2),
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Typography gutterBottom variant="h5" component="div">
          {step.step.hint}
          <IconButton onClick={() => {speakText()}} >
            <VolumeUpOutlinedIcon fontSize='small' />
          </IconButton>
        </Typography>
        </CardContent>
        )}

          { inProgress && closeEnough && deviceType === 'iPhone' (
                <Box>
                 <Button component="label" variant="contained" startIcon={<CameraAltRoundedIcon />}>
                Solve Step
                <VisuallyHiddenInput
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => solveStep(e)}/>
                 </Button>
                 {sizeWarning && <Alert severity="warning">Your image is too big</Alert>}
              </Box>

               )}

        { inProgress && closeEnough && deviceType === 'Andriod10k' (

            <Box>
              <MarkerEntity step={step} setImage={setImage} setInProgress={setInProgress} setSizeWarning={setSizeWarning} giveStepsTakenAchievement={giveStepsTakenAchievement} handleJourneyClick={handleJourneyClick}></MarkerEntity>

          {sizeWarning && (<Alert severity="warning">Your image is too big</Alert>)}
        </Box>


        )}
    </Card>

  );
};

export default StepProgress;
