import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { VisuallyHiddenInput } from '../styling/createJourneyStyle';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useNavigate, useParams } from 'react-router-dom';
import { JourneyType } from '@this/types/Journey'


type IHeaderProps = {
  userLat: number;
  userLong: number;
};
  const CreateJourney: React.FC<IHeaderProps> = ({userLat, userLong}) => {

  const initialUserId = useParams().UserId

  const [userId, setUserId] = useState<any>(initialUserId);

  const [journeyData, setJourneyData] = useState<JourneyType>({
    latitude: userLat,
    longitude: userLong,
    name: null,
    description: null,
    user: {
      id: userId
    },
    img_url: null,
    //import from home
  });

  const [image, setImage] = useState<string | null >()
  const [ready, setReady] = useState<boolean>(false)
  const [sizeWarning, setSizeWarning] = useState<boolean>(false)
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  const theme = useTheme();
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  function getStyles(name: string, personName: string[], theme: Theme) {
    return {
      fontWeight:
        personName.indexOf(name) === -1
          ? theme.typography.fontWeightRegular
          : theme.typography.fontWeightMedium,
    };
  }

  const handleTagChange = (event: SelectChangeEvent<typeof selectedTags>) => {
    const {
      target: { value },
    } = event;
    setSelectedTags(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const addTags = async(array: any[], journeyId: number) => {
    let arrayString = array.join(',')

    const response = await axios.get(`/tag/name/${arrayString}`)
    let tagIds = response.data.map((tag: {id: number}) => {
      return {journey: journeyId, tag: tag.id}
    })
    tagIds.forEach((obj: {}) => {
      axios.post('/journeytag', obj)
        .then(() => console.log('journeyTag submitted'))
        .catch((error) => console.error('could not create journeyTag'))
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJourneyData({ ...journeyData, [name]: value});
  };

  const createJourney = async () => {
      try {
          axios.post('/journey', journeyData)
          .then((response) => {
            let resData = response.data
              addTags(selectedTags, resData.id);
              navigate(`/StepForm/${userId}/${resData.id}`, {state:{userLat, userLong, resData}});
            })

        } catch (error) {
          console.error('Error creating journey:', error);
        }
  };


  useEffect(() => {
    axios.get('/tag').then((tags) => setTags(tags.data))
    if(journeyData.name && journeyData.description && journeyData.img_url) {
      console.log('ready');
      setReady(true);
    }
  }, [journeyData, sizeWarning, selectedTags])

  const navigate = useNavigate();

  const saveImage = async(e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files[0].size < 5000000) {
      setSizeWarning(false);
      const reader = await new FileReader()
      reader.addEventListener('load', async(event) => {
        const response = await axios.post(`/cloud/createJourney/${journeyData.name}`, {data: event.target.result})
        setJourneyData({ ...journeyData, img_url: response.data.secure_url});
        setImage(response.data.secure_url)
      })
      reader.readAsDataURL(e.target.files[0]);
    } else {
      setSizeWarning(true);
    }
  }


  return (
    <Paper>
      <h2>Create a New Journey</h2>
      <TextField
        label="Name"
        type="text"
        name="name"
        value={journeyData.name}
        onChange={handleInputChange}
        error={!journeyData.name}
      />
      <TextField
        label="Description"
        type="text"
        name="description"
        value={journeyData.description}
        onChange={handleInputChange}
        error={!journeyData.description}
      />
      <Button component="label" variant="outlined" startIcon={<CameraAltRoundedIcon />}>
        Journey Photo
        <VisuallyHiddenInput
          type="file"
          accept="image/*"
          capture
          onChange={(e) => saveImage(e)}
        />
      </Button>

      <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="demo-multiple-name-label">Tags</InputLabel>
        <Select
          multiple
          value={selectedTags}
          onChange={handleTagChange}
          input={<OutlinedInput label="Tags" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {tags.map((tag) => (
            <MenuItem
              key={tag.id}
              value={tag.name}
              style={getStyles(tag.name, selectedTags, theme)}
            >
              {tag.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>

      {sizeWarning && (<Alert severity="warning">Your image is too big</Alert>)}

      {image && (<img
        src={image}
        width="250"
        height="auto"
        />
      )}

      {ready && (
        <Button onClick={createJourney} variant="outlined">
          Add Steps
        </Button>
      )}
    </Paper>
  );
};

export default CreateJourney;
