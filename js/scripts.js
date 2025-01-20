function calculateAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function daysUntilBirthday(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    birthDate.setFullYear(today.getFullYear());
    if (birthDate < today) {
        birthDate.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = Math.abs(birthDate - today);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function openModal(title, link) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalLink').href = link;
    fetch(link)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const birthday = doc.querySelector('#birthday').dataset.birthday;
            const age = calculateAge(birthday);
            const gender = doc.querySelector('#gender').innerText;
            const address = doc.querySelector('.profile p:nth-of-type(4)').innerText;
            document.getElementById('modalDetails').innerText = `Age: ${age}\nGender: ${gender}\n${address}`;
            document.getElementById('myModal').style.display = "block";
        })
        .catch(error => console.error('Error fetching the page:', error));
}

function closeModal() {
    document.getElementById('myModal').style.display = "none";
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('myModal')) {
        closeModal();
    }
}

function fetchData() {
    fetch('archive.html')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const containers = doc.querySelectorAll('.container');
            const peoplePromises = Array.from(containers).map(container => {
                const link = container.getAttribute('onclick').match(/'([^']+)'/g)[1].replace(/'/g, "");
                return fetch(link)
                    .then(response => response.text())
                    .then(data => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(data, 'text/html');
                        const birthday = doc.querySelector('#birthday').dataset.birthday;
                        return {
                            name: container.getAttribute('data-name'),
                            gender: container.getAttribute('data-gender'),
                            age: container.getAttribute('data-age'),
                            birthday: birthday,
                            link: link,
                            element: container
                        };
                    });
            });

            Promise.all(peoplePromises).then(people => {
                window.people = people; // Store the people data globally
                populateSections(people);
            });
        })
        .catch(error => console.error('Error fetching the archive:', error));
}

function populateSections(people) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const birthdayToCome = people.filter(person => {
        const birthDate = new Date(person.birthday);
        return birthDate.getMonth() === currentMonth && birthDate.getDate() > currentDate;
    }).sort((a, b) => daysUntilBirthday(a.birthday) - daysUntilBirthday(b.birthday));

    const meetNewFace = people.sort(() => 0.5 - Math.random()).slice(0, 5);

    const birthdayToComeSection = document.querySelector('#birthdayToCome .section-content');
    const meetNewFaceSection = document.querySelector('#meetNewFace .section-content');

    birthdayToCome.forEach(person => {
        const clone = person.element.cloneNode(true);
        clone.setAttribute('onclick', `openModal('${person.name}', '${person.link}')`);
        birthdayToComeSection.appendChild(clone);
    });

    meetNewFace.forEach(person => {
        const clone = person.element.cloneNode(true);
        clone.setAttribute('onclick', `openModal('${person.name}', '${person.link}')`);
        meetNewFaceSection.appendChild(clone);
    });
}

function randomizePerson() {
    const randomImage = document.getElementById('randomImage');
    const randomMessage = document.getElementById('randomMessage');
    const people = window.people;

    if (!people || people.length === 0) {
        randomMessage.innerText = "No people available.";
        return;
    }

    let intervalId;
    let count = 0;
    const maxCount = 6; // Number of times to show random profiles
    const delay = 300; // Delay in milliseconds

    intervalId = setInterval(() => {
        const randomPerson = people[Math.floor(Math.random() * people.length)];
        randomImage.innerHTML = `<img src="${randomPerson.element.querySelector('img').src}" alt="${randomPerson.name}">`;
        count++;
        if (count >= maxCount) {
            clearInterval(intervalId);
            randomMessage.innerText = "Know me Better?";
            randomImage.setAttribute('onclick', `openModal('${randomPerson.name}', '${randomPerson.link}')`);
        }
    }, delay);
}

document.addEventListener('DOMContentLoaded', fetchData);