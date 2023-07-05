'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lat,lng]
  }

  _setDescription() {
    this.description = `${this.type.charAt(0).toUpperCase()}${this.type.slice(
      1
    )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, cadence, coords) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, elevationGain, coords) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this));
    } else alert('Your browser does not support geolocation.');
  }

  _loadMap(position) {
    const { longitude, latitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on the map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapEvent) {
    this.#mapEvent = mapEvent;
    if (this.#mapEvent.type === 'click') {
      form.classList.remove('hidden');
      inputDistance.focus();
    }
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    //Helper functions for validating inputs
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    const { lat, lng } = this.#mapEvent.latlng;

    // Prevent default behaviour of form submissions
    event.preventDefault();

    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(`Inputs have to be positive numbers!`);

      workout = new Running(distance, duration, cadence, [lat, lng]);
      this.#workouts.push(workout);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert(`Inputs have to be positive numbers!`);

      workout = new Cycling(distance, duration, elevation, [lat, lng]);
      this.#workouts.push(workout);
    }

    //Add the object to the workout list
    this._renderWorkout(workout);

    //Render workout on map as a marker
    this._renderWorkoutMarker(workout, type);
  }

  _clearForm() {
    inputDuration.value =
      inputCadence.value =
      inputElevation.value =
      inputDistance.value =
        '';
  }

  _hideForm() {
    this._clearForm();
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _renderWorkoutMarker(workout) {
    const month = months[workout.date.getMonth()];
    const workoutType =
      workout.type.charAt(0).toUpperCase() + workout.type.slice(1);

    const description = `${
      workout.type === 'running' ? '🏃‍♂️' : '🚲'
    } ${workoutType} workout on ${month} ${workout.date.getDate()}`;

    const popup = L.popup({
      maxWidth: 250,
      minWidth: 50,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    });
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(popup)
      .setPopupContent(description);

    marker.openPopup();
    this._clearForm();
    this._hideForm();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚲'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.type === 'running'
            ? workout.pace.toFixed(1)
            : workout.speed.toFixed(1)
        }</span>
        <span class="workout__unit">${
          workout.type === 'running' ? 'min/km' : 'km/h'
        }</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🦶🏼' : '🚴‍♂️'
        }</span>
        <span class="workout__value">${
          workout.type === 'running'
            ? workout.cadence.toFixed(1)
            : workout.speed.toFixed(1)
        }</span>
        <span class="workout__unit">${
          workout.type === 'running' ? 'SPM' : 'M'
        }</span>
    </div>
        `;

    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();

/* const running = new Running(3, 30, 60, [59, 18]);
const cycling = new Cycling(27, 95, 523, [59, 18]);
console.log(running, cycling); */
