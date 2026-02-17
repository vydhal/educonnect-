
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const API_URL = 'http://127.0.0.1:5000/api';

async function main() {
    console.log('--- STARTING DIAGNOSTIC ---');

    // 1. Logic Check - Login
    console.log('1. Attempting Login...');
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'vydhal@gmail.com', password: 'Vydhal@112358' })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            console.error(`❌ Login Failed: ${loginRes.status} - ${txt}`);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login Successful. Token received.');

        // 2. Profile Check
        console.log('2. Fetching Profile...');
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileRes.ok) {
            const txt = await profileRes.text();
            console.error(`❌ Profile Fetch Failed: ${profileRes.status} - ${txt}`);
        } else {
            const profile = await profileRes.json();
            console.log(`✅ Profile Fetched: ${profile.name} (${profile.role})`);
        }

        // 3. Admin Users Check
        console.log('3. Fetching Admin Users...');
        const usersRes = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!usersRes.ok) {
            const txt = await usersRes.text();
            console.error(`❌ Admin Users Fetch Failed: ${usersRes.status} - ${txt}`);
        } else {
            const usersData = await usersRes.json();
            console.log(`✅ Admin Users Fetched. Total: ${usersData.total}`);
            usersData.users.forEach((u: any) => console.log(`   - ${u.email} (${u.role})`));
        }

    } catch (error) {
        console.error('❌ NETWORK/FETCH ERROR:', error);
    }
}

main();
