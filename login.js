// login.js
const supabaseUrl = 'https://ddxznuiarrmsjkhscvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeHpudWlhcnJtc2praHNjdnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTQ2MzcsImV4cCI6MjA4MzUzMDYzN30.ILDZkHznrPRriDuLhPGWfeo_roeyrg6K5lmR7Wwl-Do';
const { createClient } = window.supabase;
// Renamed to sbClient to avoid conflict with the global library object
const sbClient = createClient(supabaseUrl, supabaseKey);

const loginBox = document.getElementById('loginBox');
const registerBox = document.getElementById('registerBox');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const regRole = document.getElementById('regRole');
const studentFields = document.getElementById('studentFields');

showRegister.addEventListener('click', () => {
    loginBox.classList.remove('animate-premium-in');
    loginBox.classList.add('animate-premium-out');
    setTimeout(() => {
        loginBox.classList.add('hidden');
        loginBox.classList.remove('animate-premium-out');
        registerBox.classList.remove('animate-premium-out');
        registerBox.classList.remove('hidden');
        registerBox.classList.add('animate-premium-in');
        lucide.createIcons();
    }, 500);
});

showLogin.addEventListener('click', () => {
    registerBox.classList.remove('animate-premium-in');
    registerBox.classList.add('animate-premium-out');
    setTimeout(() => {
        registerBox.classList.add('hidden');
        registerBox.classList.remove('animate-premium-out');
        loginBox.classList.remove('animate-premium-out');
        loginBox.classList.remove('hidden');
        loginBox.classList.add('animate-premium-in');
        lucide.createIcons();
    }, 500);
});

// Password Toggle
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    
    toggle.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        lucide.createIcons();
    });
}

setupPasswordToggle('loginPassword', 'toggleLoginPass');
setupPasswordToggle('regPassword', 'toggleRegPass');

regRole.addEventListener('change', (e) => {
    if (e.target.value === 'student') {
        studentFields.classList.remove('hidden');
    } else {
        studentFields.classList.add('hidden');
    }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Fields cannot be empty");
        return;
    }

    try {
        const { data: student, error: sError } = await sbClient
            .from("student")
            .select("*")
            .eq("email", email)
            .eq("password", password);

        if (sError) throw sError;

        if (student && student.length > 0) {
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userName", student[0].student_name);
            localStorage.setItem("userRole", "student");
            window.location.href = "student-dashboard.html";
            return;
        }

        const { data: faculty, error: fError } = await sbClient
            .from("faculty")
            .select("*")
            .eq("email", email)
            .eq("password", password);

        if (fError) throw fError;

        if (faculty && faculty.length > 0) {
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userName", faculty[0].faculty_name);
            localStorage.setItem("userRole", "faculty");
            window.location.href = "faculty-dashboard.html";
            return;
        }

        alert("Invalid Credentials. Please check your email and password.");
    } catch (error) {
        alert("Connection Error: " + error.message);
    }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
    const role = regRole.value;
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const dept = document.getElementById('regDept').value;

    if (!email || !password || !name || !dept) {
        alert("Please fill all required fields");
        return;
    }

    // GENERATE UNIQUE ID STARTING WITH 26
    const uniqueId = parseInt("26" + Math.floor(1000 + Math.random() * 9000));

    try {
        if (role === 'student') {
            const roll = document.getElementById('regRoll').value;
            const year = document.getElementById('regYear').value;
            const { error } = await sbClient.from('student').insert([{
                student_id: uniqueId, // Added to fix not-null constraint
                student_name: name,
                email,
                password,
                department: dept,
                roll_no: roll,
                year
            }]);
            if (error) throw error;
        } else {
            const { error } = await sbClient.from('faculty').insert([{
                faculty_id: uniqueId, // Added to fix not-null constraint
                faculty_name: name,
                email,
                password,
                department: dept
            }]);
            if (error) throw error;
        }
        alert(`Registration successful! Your Unique ID is: ${uniqueId}`);
        showLogin.click();
    } catch (error) {
        alert("Registration Error: " + error.message);
    }
});