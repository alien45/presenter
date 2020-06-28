import React, { useState, useEffect } from 'react'
import client from './client'
import './App.css'

export default function App() {
	const [password, setPassword] = useState(localStorage.getItem('password'))
	const [slideIndex, setSlideIndexOrg] = useState(0)
	const [slides, setSlides] = useState([]) // slide names
	const [isPresenter, setIsPresenter] = useState(false)
	const DO_PRESENT = getUrlParam('present').toLowerCase() === 'yes'
	const setSlideIndex = index => {
		window.slideIndex = index
		setSlideIndexOrg(index)
	}
	const handleLogin = deferred(() => {
		client.login(DO_PRESENT && password, (_, admin, slides, index) => {
			if (DO_PRESENT && password) {
				setIsPresenter(admin)
				admin && setupKeyHandler(slides.length)
				// clear password if incorrect
				localStorage.setItem('password', admin ? password : '')
				!admin && setPassword(password)
			}
			setSlides(slides || [])
			setSlideIndex(index)
		})
	}, 100)

	useEffect(() => {
		handleLogin()
		client.onSlideIndex((index) => {
			setSlideIndex(index)
			console.log('Slide changed', index)
		})

		client.onReconnect(() => setTimeout(() => {
			// client.getSlides(slides => setSlides(slides || []))
			handleLogin()
		}, 500))
		return () => { }
	}, [])

	if (DO_PRESENT && !isPresenter && !localStorage.getItem('password')) return (
		<div style={{ textAlign: 'center' }}>
			<h3>Please enter password to login</h3>
			<form onSubmit={e => e.preventDefault() | handleLogin()}>
				<input
					type='password'
					onChange={e => setPassword(e.target.value)}
					placeholder='Enter password'
					style={styles.input}
				/>
				<button
					style={styles.button}
					onClick={e => e.preventDefault() | handleLogin()}
				>
					Login as presenter
					</button>
				<button
					style={styles.button}
					onClick={() => window.location.href = '?present=no'}
				>
					View Only
				</button>
			</form>
			<div>
			</div>
		</div>
	)
	return (
		<div>
			<div style={styles.imgContainer}>
				{slides.map((slide, index) => (
					<img {...{
						src: `./slides/${slide}`,
						style: {
							...styles.img,
							display: slideIndex !== index ? 'none' : 'block',
						},
						alt: slide,
					}} />
				))}
			</div>
			<div>
				<div
					style={styles.left}
					onClick={() => setSlide(slideIndex - 1, slides.length)}
					title={slides.length && slideIndex >= 1 && 'Previous'}
				/>
				<div
					style={styles.right}
					onClick={() => setSlide(slideIndex + 1, slides.length)}
					title={slides.length && slideIndex < slides.length - 1 && 'Next'}
				/>
			</div>
			<div style={styles.counter}>
				{slideIndex + 1}/{slides.length}
			</div>
		</div>
	)
}

const styles = {
	button: {
		background: '#dadada',
		cursor: 'pointer',
		fontWeight: 'bold',
		padding: '10px 15px',
	},
	counter: {
		position: 'fixed',
		top: 25,
		left: 25,
		fontWeight: 'bold',
		color: 'grey',
	},
	img: {
		width: 'auto',
		height: 'auto',
		maxWidth: '100%',
		maxHeight: '100%',
		margin: 'auto',
	},
	imgContainer: {
		width: '100%',
		height: '100%',
		display: 'block',
		position: 'absolute',
		overflow: 'hidden',
	},
	input: {
		padding: '10px 15px',
		borderRadius: 3,
		border: '1px solid grey'
	},
	left: {
		cursor: 'pointer',
		position: 'fixed',
		height: '100%',
		width: '40%',
		top: 0,
		left: 0,
	},
	right: {
		cursor: 'pointer',
		position: 'fixed',
		height: '100%',
		width: '40%',
		top: 0,
		right: 0,
	}
}

// getUrlParam reads the URL parameters
//
// Params:
// @name    string: (optional) if supplied will return a specific paramenter as string.
//                  Otherwise, will return an object containing all the URL parameters with respective values.
//
// returns  string/object
function getUrlParam(name) {
	const params = {}
	const regex = /[?&]+([^=&]+)=([^&]*)/gi
	window.location.href.replace(regex, (_, key, value) => params[key] = value)
	return name ? params[name] || '' : params
}

// deferred returns a function that invokes the callback function after certain delay/timeout
// If the returned function is invoked again before timeout,
// the invokation will be deferred further with the duration supplied in @delay
//
// Params:
// @callback  function  : function to be invoked after deferred delay
// @delay     number    : number of milliseconds to be delayed.
//                        Default value: 50
// @thisArg    object   : optional, makes sure callback is bounded to supplied object 
export function deferred(callback, delay, thisArg) {
	let timeoutId
	return function () {
		const args = arguments
		if (timeoutId) clearTimeout(timeoutId)
		timeoutId = setTimeout(function () {
			callback && callback.apply(thisArg, args)
		}, delay || 50)
	}
}

function setupKeyHandler(numSlides) {
	document.onkeydown = e => {
		// control slide on arrow key press and page up/down key press
		e = e || window.event;
		let index = window.slideIndex
		switch (e.keyCode) {
			case 35: // End key
				index = numSlides - 1 // go to last slide
				break
			case 36: // Home key
				index = 0 // go to first slide
				break
			case 38: // up arrow
			case 37: // left arrow
				index-- // go to previous slide
				break
			case 39: // right arrow
			case 40: // down arrow
				index++ // go to next slide
				break
			default:
				// console.log({ keyCode: e.keyCode })
				break
		}
		setSlide(index, numSlides)
	}
}

const setSlide = (index, numSlides) => {
	if (index === window.slideIndex || index < 0 || index >= numSlides) return
	client.setCurrentSlide(index, err => err && alert(`Failed to set slide. Error: ${err}`))
}