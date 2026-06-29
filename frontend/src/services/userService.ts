import axios from 'axios';

const BASE = '/api/users';

export interface UserDetails {
  id: number | string;
  name: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  vipUser: boolean | null;
  employeeId: string | null;
  departmentName: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  jobTitle: string | null;
  reportingTo: string | null;
  mobile: string | null;
  paygrade: string | null;
  primaryEmail: string | null;
}

export const getUserDetails = (userId: number | string): Promise<UserDetails> =>
  axios.get(`${BASE}/${encodeURIComponent(String(userId))}/details`).then((r) => r.data);
