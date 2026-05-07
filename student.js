// student.js
{
const supabaseUrl = 'https://ddxznuiarrmsjkhscvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeHpudWlhcnJtc2praHNjdnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTQ2MzcsImV4cCI6MjA4MzUzMDYzN30.ILDZkHznrPRriDuLhPGWfeo_roeyrg6K5lmR7Wwl-Do';
const { createClient } = window.supabase;
const supabase = createClient(supabaseUrl, supabaseKey);

let student = null;
let courses = [];
let myEnrollments = [];
let searchQuery = '';

const email = localStorage.getItem("userEmail");

async function init() {
    if (!email) {
        window.location.href = "login.html";
        return;
    }
    await fetchStudent();
    await fetchCourses();
    renderStats();
    renderCatalog();
}

async function fetchStudent() {
    const { data, error } = await supabase.from("student").select("*").eq("email", email);
    if (error || !data.length) {
        window.location.href = "login.html";
        return;
    }
    student = data[0];
    updateProfileUI();
    await fetchEnrollments(student.student_id);
}

async function fetchCourses() {
    const { data } = await supabase.from("course").select("*");
    courses = data || [];
}

async function fetchEnrollments(studentId) {
    const { data: enrolls } = await supabase.from("enrollment").select("*").eq("student_id", studentId);
    myEnrollments = enrolls || [];
}

function updateProfileUI() {
    const initials = student.student_name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userName').innerText = student.student_name;
    document.getElementById('userEmail').innerText = student.email;
    document.getElementById('userBadge').innerText = `${student.year} Year Student`;
    document.getElementById('userAvatar').innerText = initials;
    
    document.getElementById('profileName').innerText = student.student_name;
    document.getElementById('profileEmail').innerText = student.email;
    document.getElementById('profileDept').innerText = student.department;
    document.getElementById('profileRoll').innerText = student.roll_number;
    document.getElementById('profileYear').innerText = student.year;
    document.getElementById('profileAvatar').innerText = initials;
}

function renderStats() {
    document.getElementById('statEnrolled').innerText = myEnrollments.length;
    document.getElementById('statCompleted').innerText = myEnrollments.filter(e => e.status === 'Completed').length;
    document.getElementById('statProgress').innerText = myEnrollments.filter(e => e.status === 'In Progress').length;
}

function getCourseImage(courseName, customImg) {
    if (customImg) return customImg;
    const name = courseName.toLowerCase();
    if (name.includes('python')) return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop';
    if (name.includes('java')) return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop';
    if (name.includes('html') || name.includes('web')) return 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2064&auto=format&fit=crop';
    if (name.includes('react')) return 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop';
    if (name.includes('data')) return 'https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=2070&auto=format&fit=crop';
    return `https://picsum.photos/seed/${courseName}/400/200`;
}

function renderCatalog() {
    const catalogArea = document.getElementById('catalogArea');
    catalogArea.innerHTML = '';
    
    const filtered = courses.filter(c => {
        const [name] = c.course_name.split('|||');
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    filtered.forEach(c => {
        const [name, img] = c.course_name.split('|||');
        const courseImage = getCourseImage(name, img);
        const isEnrolled = myEnrollments.some(e => e.course_id === c.course_id);

        const card = document.createElement('div');
        card.className = 'glass-panel course-card animate-scale-in';
        card.innerHTML = `
            <div class="h-48 overflow-hidden">
                <img src="${courseImage}" class="course-img" alt="Course" referrerPolicy="no-referrer">
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-2xl font-black text-slate-900">${name}</h3>
                    <span class="badge badge-blue">${c.duration}</span>
                </div>
                <p class="text-slate-500 text-sm mb-8 font-medium leading-relaxed">Master ${name} with our comprehensive curriculum designed for modern developers.</p>
                ${isEnrolled ? `
                    <button onclick="startStudy(${c.course_id})" class="btn-primary w-full bg-slate-800 hover:bg-slate-900">Continue Learning</button>
                ` : `
                    <button onclick="enroll(${c.course_id})" class="btn-primary w-full">Enroll Now</button>
                `}
            </div>
        `;
        catalogArea.appendChild(card);
    });
    lucide.createIcons();
}

function renderMyLearning() {
    const myLearningArea = document.getElementById('myLearningArea');
    myLearningArea.innerHTML = '';

    // Ensure unique courses in display
    const uniqueEnrollments = [];
    const seenCourses = new Set();
    
    myEnrollments.forEach(e => {
        if (!seenCourses.has(e.course_id)) {
            seenCourses.add(e.course_id);
            uniqueEnrollments.push(e);
        }
    });

    uniqueEnrollments.forEach(e => {
        const c = courses.find(x => x.course_id === e.course_id);
        if (!c) return;
        const [name, img] = c.course_name.split('|||');
        const courseImage = getCourseImage(name, img);

        const card = document.createElement('div');
        card.className = 'glass-panel course-card animate-scale-in';
        card.innerHTML = `
            <div class="h-48 overflow-hidden">
                <img src="${courseImage}" class="course-img" alt="Course" referrerPolicy="no-referrer">
            </div>
            <div class="p-8">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-2xl font-black text-slate-900">${name}</h3>
                    <span class="badge badge-blue">${e.status}</span>
                </div>
                <div class="progress-container mb-8">
                    <div class="progress-bar" style="width: ${e.status === 'Completed' ? '100%' : '45%'}"></div>
                </div>
                <button onclick="startStudy(${c.course_id})" class="btn-primary w-full">Resume Lessons</button>
            </div>
        `;
        myLearningArea.appendChild(card);
    });
}


window.enroll = async function(courseId) {
    if (!student) return;
    
    // Check for duplicate enrollment
    const isAlreadyEnrolled = myEnrollments.some(e => e.course_id === courseId);
    if (isAlreadyEnrolled) {
        alert("Already enrolled in this course");
        return;
    }

    const { error } = await supabase.from("enrollment").insert([{ 
        student_id: student.student_id, 
        course_id: courseId, 
        status: 'In Progress' 
    }]);
    if (error) alert(error.message);
    else {
        alert("Enrolled Successfully!");
        await fetchEnrollments(student.student_id);
        switchView('myLearning');
    }
}

window.startStudy = function(courseId) {
    window.location.href = `lesson.html?courseId=${courseId}`;
}

function switchView(view) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(v => {
        v.classList.remove('active', 'view-transition');
        v.style.display = 'none';
    });
    document.querySelectorAll('.sidebar .nav-link').forEach(a => a.classList.remove('active'));
    
    const views = {
        dashboard: { id: 'dashboardView', nav: 'navDashboard' },
        myLearning: { id: 'myLearningView', nav: 'navMyLearning' },
        courses: { id: 'coursesView', nav: 'navCourses' },
        profile: { id: 'profileView', nav: 'navProfile' }
    };

    const target = views[view];
    const targetEl = document.getElementById(target.id);
    targetEl.style.display = 'block';
    targetEl.classList.add('active', 'view-transition');
    document.getElementById(target.nav).classList.add('active');

    if (view === 'dashboard') renderStats();
    if (view === 'myLearning') renderMyLearning();
    if (view === 'courses') renderCatalog();
}

document.getElementById('navDashboard').addEventListener('click', () => switchView('dashboard'));
document.getElementById('navMyLearning').addEventListener('click', () => switchView('myLearning'));
document.getElementById('navCourses').addEventListener('click', () => switchView('courses'));
document.getElementById('navProfile').addEventListener('click', () => switchView('profile'));
document.getElementById('profileBackBtn').addEventListener('click', () => switchView('courses'));

document.getElementById('courseSearch').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCatalog();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = "login.html";
});

init();
}
