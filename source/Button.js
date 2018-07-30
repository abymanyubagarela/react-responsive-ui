import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import ActivityIndicator from './ActivityIndicator'

// `PureComponent` is only available in React >= 15.3.0.
const PureComponent = React.PureComponent || React.Component

export default class Button extends PureComponent
{
	static propTypes =
	{
		// onClick handler.
		// Doesn't receive `event` by default.
		// Can be `async`/`await` or return a `Promise`
		// in which case it will show "wait" animation.
		onClick         : PropTypes.func,

		// onClick handler.
		// (deprecated, use `onClick(event)` instead)
		action          : PropTypes.func,

		// If `wait` is `true` then the button
		// will be disabled and a spinner will be shown.
		wait            : PropTypes.bool,

		// (deprecated)
		// (use `wait` instead)
		// If `busy` is `true` then the button
		// will be disabled and a spinner will be shown.
		busy            : PropTypes.bool,

		// Disables the button
		disabled        : PropTypes.bool,

		// When `true`, the button will submit an enclosing form.
		submit          : PropTypes.bool,

		// If `link` is set, then the button is gonna be an <a/> tag.
		link            : PropTypes.oneOfType([ PropTypes.string, PropTypes.bool ]),

		// Custom React component for the button.
		component       : PropTypes.func,

		// HTML `title` attribute
		title           : PropTypes.string,

		// Set to `true` to stretch the button to full width
		stretch         : PropTypes.bool.isRequired,

		// CSS class name
		className       : PropTypes.string,

		// CSS style object for the button container
		style           : PropTypes.object
	}

	static defaultProps =
	{
		// Set to `true` to stretch the button to full width
		stretch : false
	}

	state =
	{
		waiting : this.props.wait || this.props.busy
	}

	componentDidUpdate(prevProps)
	{
		if ((!prevProps.wait && this.props.wait) || (!prevProps.busy && this.props.busy))
		{
			this.startWaiting()
		}
		else if ((prevProps.wait && !this.props.wait) || (prevProps.busy && !this.props.busy))
		{
			this.stopWaiting()
		}
	}

	componentDidMount()
	{
		this._isMounted = true
	}

	componentWillUnmount()
	{
		this._isMounted = false

		clearTimeout(this.waitingHasStartedTimer)
		clearTimeout(this.waitingHasEndedTimer)
	}

	startWaiting()
	{
		clearTimeout(this.waitingHasStartedTimer)
		clearTimeout(this.waitingHasEndedTimer)

		this.setState
		({
			waiting : true,
			waitingHasStarted : false,
			waitingHasEnded : false
		})

		this.waitingHasStartedTimer = setTimeout(() =>
		{
			if (this._isMounted) {
				this.setState({
					waitingHasStarted: true
				})
			}
		},
		// Adding a non-null delay in order to
		// prevent web browser from optimizing
		// adding CSS classes and doing it simultaneously
		// rather than sequentially (required for CSS transition).
		10)
	}

	stopWaiting = () =>
	{
		clearTimeout(this.waitingHasStartedTimer)

		this.setState
		({
			waiting : false,
			waitingHasStarted : false,
			waitingHasEnded : true
		})

		// Gives some time to CSS opacity transition to finish.
		this.waitingHasEndedTimer = setTimeout(() =>
		{
			if (this._isMounted) {
				this.setState({
					waitingHasEnded : false
				})
			}
		},
		300)
	}

	render()
	{
		const
		{
			component,
			link,
			title,
			wait,
			busy,
			disabled,
			action,
			onClick,
			submit,
			stretch,
			style,
			className,
			children,
			...rest
		}
		= this.props

		const
		{
			waiting,
			waitingHasStarted,
			waitingHasEnded
		}
		= this.state

		const properties =
		{
			...rest,
			ref : this.storeInstance,
			title,
			style,
			className : classNames('rrui__input', 'rrui__button-reset', 'rrui__button',
			{
				'rrui__button--busy'       : waiting,
				'rrui__button--disabled'   : disabled,
				'rrui__button--stretch'    : stretch,
				'rrui__button-reset--link' : link
			},
			className)
		}

		if (link)
		{
			const LinkComponent = component || 'a'

			return (
				<LinkComponent
					href={ component ? undefined : link }
					onClick={ this.linkOnClick }
					{ ...properties }>

					{ children }
				</LinkComponent>
			)
		}

		return (
			<button
				type={ submit ? 'submit' : 'button' }
				disabled={ waiting || disabled }
				onClick={ this.buttonOnClick }
				{ ...properties }>

				{ (waiting || waitingHasEnded) &&
					<div
						className={ classNames('rrui__button__busy',
						{
							'rrui__button__busy--after-show' : waitingHasStarted
						}) }/>
				}
				{ children }
			</button>
		)
	}

	storeInstance = (ref) => this.button = ref

	focus = () => this.button.focus()

	linkOnClick = (event) =>
	{
		const
		{
			wait,
			busy,
			disabled,
			action,
			onClick
		}
		= this.props

		// Only handle left mouse button clicks
		// ignoring those ones with a modifier key pressed.
		if (event.button !== 0
			|| event.shiftKey
			|| event.altKey
			|| event.ctrlKey
			|| event.metaKey)
		{
			return
		}

		if (wait || busy || disabled)
		{
			return
		}

		// Could be just a "submit" button without having any `action`.
		// Could also be just a `link` button.
		// Therefore "preventing default" only if `action` is set:
		// for example, if `link` is set and no `action`
		// then it should proceed with navigating to the `link`.
		// And if `link` is set and `action` is specified too
		// then it will prevent it from navigating to the `link`.
		if (action || onClick) {
			event.preventDefault()
		}

		this.buttonOnClick()
	}

	buttonOnClick = (event) =>
	{
		const { action, onClick } = this.props

		let result
		// Could be just a `<button type="submit"/>`
		// without any `action` supplied.
		if (action) {
			result = action()
		} else if (onClick) {
			result = onClick()
		}

		if (result && typeof result.then === 'function') {
			this.startWaiting()
			result.then(this.stopWaiting, this.stopWaiting)
		}
	}
}