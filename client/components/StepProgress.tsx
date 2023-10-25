import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StepProgressType } from '@this/types/StepProgress';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { VisuallyHiddenInput } from '../styling/createJourneyStyle';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';


type IHeaderProps = {
  userId: number
  step: StepProgressType
  userLat: number;
  userLong: number;
};

const StepProgress: React.FC<IHeaderProps> = ({step, userLat, userLong, userId}) => {
  const [image, setImage] = useState<string | null | ArrayBuffer>()
  const [closeEnough, setCloseEnough] = useState(false)
  const [sizeWarning, setSizeWarning] = useState<boolean>(false)
  const [selectedStep, setSelectedStep] = useState(null);


  const navigate = useNavigate();


  const solveStep = async(e: React.ChangeEvent<HTMLInputElement>) => {




    if(e.target.files[0].size < 5000000) {
      setSizeWarning(false);
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

      // Increment steps taken in user data
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
          console.log('these are your achievements---->',userAchievements)
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
      reader.readAsDataURL(e.target.files[0]);
    } else {
      setSizeWarning(true);
    }
  }



  const getLocation = () => {
    const feetPerDegree = 364000;

    const latDiff = Math.abs(Number(step.step.latitude) - userLat);
    const lonDiff = Math.abs(Number(step.step.longitude) - userLong);

    const distanceInFeet = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * feetPerDegree;

    console.log('distance in feet:', distanceInFeet)
    if(distanceInFeet < 20) {
      setCloseEnough(true);
    } else {
      setCloseEnough(false);
    }

 }

  useEffect(() => {
    getLocation()
  }, [userLat, userLong])

  // Function to grab stepData onClick
 const grabStepData = (
  _event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setSelectedStep(step);
    //setShowARScene(true);
    //console.log(_event)
    // Send stepData to AR component for rendering
    navigate('/ar', {state: { stepData: step }})

  };


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
    <Card sx={{ maxWidth: 345 }}>
        {!step.in_progress && (<CardMedia
          sx={{ height: 140 }}
          image={step.image_url}
        />)}
        {image && (<CardMedia
          sx={{ height: 140 }}
          image={image}
        />)}
        <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {step.step.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" >
          {text}
          <IconButton onClick={() => {speakText()}} >
            <VolumeUpOutlinedIcon fontSize='small' />
          </IconButton>
        </Typography>
        </CardContent>
        <CardActions>
          {closeEnough && step.in_progress && (
            <div>
              <Button component="label" variant="contained" startIcon={<CameraAltRoundedIcon />}>
                Solve Step
                <VisuallyHiddenInput
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => solveStep(e)}
                  onClick={(e) => grabStepData(e)} />
              </Button>
              {/* <Button
                onClick={(e) => grabStepData(e)}
                variant="contained" color="primary"
                startIcon={<CameraAltRoundedIcon/>}
                > See in AR
              </Button> */}
            </div>
          )}
          {sizeWarning && (<Alert severity="warning">Your image is too big</Alert>)}
        </CardActions>
    </Card>

  );
};

export default StepProgress;