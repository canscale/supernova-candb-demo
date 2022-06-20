import * as React from 'react';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

export default function BasicDateRangePicker(startDate: Date, setStartDate: React.Dispatch<React.SetStateAction<Date>>) {
  const maxDate = new Date('2021-10-26');
  const minDate = new Date('2021-07-15');

  // @ts-ignore
  const ExampleCustomInput = React.forwardRef(({ value, onClick }, ref) => (
    // @ts-ignore
    <button className="example-custom-input" onClick={onClick} ref={ref}>
      {value}
    </button>
  ));

  return (
    <DatePicker
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      dateFormat="yyyy/MM/dd"
      minDate={minDate}
      maxDate={maxDate}
      customInput={<ExampleCustomInput/>}
    />
  )
}
