'use server';

import { addStaffByEmail, removeStaff } from '@/lib/afx/server/staffAdmin';

export async function addStaffAction(email: string) { return addStaffByEmail(email); }
export async function removeStaffAction(userId: string) { return removeStaff(userId); }
