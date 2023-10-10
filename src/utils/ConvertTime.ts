import moment from "moment";

export default function ConvertTime(data_input: string) {
  return moment(data_input).format("llll");
}
