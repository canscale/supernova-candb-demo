import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function RowRadioButtonsGroup(
  queryCategory: string, 
  onQueryCategoryChange: (queryCategory: string) => void, 
) {

  return (
    <FormControl>
      <FormLabel id="demo-row-radio-buttons-group-label">Query By</FormLabel>
      <RadioGroup
        row
        aria-labelledby="demo-row-radio-buttons-group-label"
        name="row-radio-buttons-group"
        value={queryCategory}
        onChange={(e) => onQueryCategoryChange(e.target.value)}
      >
        <FormControlLabel value="timestamp" control={<Radio />} label="Timestamp" />
        <FormControlLabel value="score" control={<Radio />} label="Score" />
        <FormControlLabel value="subreddit" control={<Radio />} label="Subreddit" />
      </RadioGroup>
    </FormControl>
  );
}