import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { polyfill as reactLifecyclesCompat } from 'react-lifecycles-compat'

import Divider from './Divider'

import { submitFormOnCtrlEnter } from './utility/dom'
import { onBlur, focus } from './utility/focus'

// `PureComponent` is only available in React >= 15.3.0.
const PureComponent = React.PureComponent || React.Component

// Workaround for `react-hot-loader`.
// https://github.com/gaearon/react-hot-loader#checking-element-types
const DividerType = <Divider/>.type

@reactLifecyclesCompat
export default class List extends PureComponent
{
	static propTypes =
	{
		value : PropTypes.any,
		onChange : PropTypes.func,

		// If a `<List/>` has `onChange` then it wraps `<List.Item/>`s with `<button/>`s.
		// The `onChange` added by `<ExpandableList/>` overrides the original `onChange`.
		// If there was no `onChange` — there will be one.
		// So to retain that info `hasOnChange` property is used as a workaround.
		// `undefined` means "ignore this property".
		hasOnChange : PropTypes.bool,

		// If `items` property is supplied then it's used to
		// detect "on items changed" event in `getDerivedStateFromProps`.
		// It seems to be the only usage of the `items` property.
		items : PropTypes.arrayOf(PropTypes.object),

		// Legacy method, use `onChange` instead.
		onSelectItem : PropTypes.func,
		highlightSelectedItem : PropTypes.bool.isRequired,

		onFocusItem : PropTypes.func,
		onKeyDown : PropTypes.func,

		// ARIA `role` attribute.
		role : PropTypes.string,

		// `role="combobox"` requires `aria-selected` to be
		// `true` on the currently focused list option.
		ariaSelectedOnFocusedItem : PropTypes.bool,

		// If a `<List/>` is `expandable`
		// then it won't be `.rrui__list:not(.rrui__list--focus)`.
		// `.rrui__list:not(.rrui__list--focus)` is only for standalone lists.
		expandable : PropTypes.bool,

		tabbable : PropTypes.bool.isRequired,
		shouldFocus : PropTypes.bool.isRequired,
		focusFirstItemWhenItemsChange : PropTypes.bool.isRequired,
		createButtons : PropTypes.bool.isRequired
	}

	static defaultProps =
	{
		tabbable : true,
		shouldFocus : true,
		focusFirstItemWhenItemsChange : false,
		createButtons : true,
		highlightSelectedItem : true
	}

	static getDerivedStateFromProps(props, state)
	{
		const newState =
		{
			items : props.items
		}

		// If `items` property is supplied
		// then it's used to detect "on items changed" event.
		if (state.items && state.items !== props.items)
		{
			newState.items = props.items

			// Focus the first item.
			if (props.focusFirstItemWhenItemsChange)
			{
				newState.focusedItemValue = props.items[0].value
				newState.focusedItemIndex = 0
			}
		}

		if (state.selectedItemValue !== props.value)
		{
			newState.selectedItemValue = props.value

			newState.focusedItemValue = props.value
			newState.focusedItemIndex = props.value === undefined ? undefined : findItemIndexByValue(props.value, props.children)
		}

		return newState
	}

	state = {}

	// `ref`s of all items currently rendered.
	itemRefs = []

	componentWillUnmount()
	{
		clearTimeout(this.blurTimer)
	}

	getFocusedItemIndex = () =>
	{
		const { focusedItemIndex } = this.state

		return focusedItemIndex
	}

	clearFocus = () =>
	{
		this.setState
		({
			focusedItemIndex : undefined,
			focusedItemValue : undefined
		})
	}

	// Deprecated method name.
	unfocus = this.clearFocus

	// Focuses on the list.
	focus = () => {
		const { focusedItemIndex } = this.state
		if (focusedItemIndex !== undefined) {
			return this.focusItem(focusedItemIndex)
		}
		// Focus the first focusable list item.
		this.focusItem(this.getFirstFocusableItemIndex())
	}

	getFirstFocusableItemIndex()
	{
		let i = 0
		while (i < this.itemRefs.length)
		{
			if (this.itemRefs[i]) {
				return i
			}
		}
	}

	getItemValue(index)
	{
		const { children } = this.props

		const item = React.Children.toArray(children)[index]
		return item.props.value
	}

	// Can be public API for programmatically focusing a certain `<List.Item/>`.
	focusItem = (focusedItemIndex) =>
	{
		const { onFocusItem, shouldFocus } = this.props

		this.setState
		({
			// Focus the item.
			focusedItemIndex,
			// Store the focused item value.
			// This is used for cases like autocomplete
			// where the list of options changes but
			// the focused option stays focused.
			focusedItemValue: focusedItemIndex === undefined ? undefined : this.getItemValue(focusedItemIndex)
		},
		() => {
			if (focusedItemIndex !== undefined) {
				if (shouldFocus) {
					focus(this.itemRefs[focusedItemIndex])
				}
				if (onFocusItem) {
					onFocusItem(focusedItemIndex)
				}
			}
		})
	}

	onKeyDown = (event) =>
	{
		const { onKeyDown, children } = this.props
		const { focusedItemIndex } = this.state

		if (onKeyDown) {
			onKeyDown(event)
		}

		if (event.defaultPrevented) {
			return
		}

		if (submitFormOnCtrlEnter(event, this.input)) {
			return
		}

		if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
			return
		}

		if (React.Children.count(children) > 0)
		{
			switch (event.keyCode)
			{
				// "Up" arrow.
				// Select the previous item (if present).
				case 38:
					event.preventDefault()

					const previousIndex = this.getPreviousFocusableItemIndex()

					if (previousIndex !== undefined) {
						this.focusItem(previousIndex)
					}

					return

				// "Down" arrow.
				// Select the next item (if present).
				case 40:
					event.preventDefault()

					const nextIndex = this.getNextFocusableItemIndex()

					if (nextIndex !== undefined) {
						this.focusItem(nextIndex)
					}

					return

				// "Enter".
				case 13:
					// Choose the focused item on Enter
					event.preventDefault()

					if (focusedItemIndex !== undefined) {
						this.itemRefs[focusedItemIndex].click()
					}

					return

				// "Spacebar".
				case 32:
					// Choose the focused item on Spacebar.
					if (focusedItemIndex !== undefined)
					{
						if (this.itemRefs[focusedItemIndex].tagName.toLowerCase() !== 'button')
						{
							event.preventDefault()
							this.itemRefs[focusedItemIndex].click()
						}
					}

					return
			}
		}
	}

	// Get the previous option (relative to the currently focused option)
	getPreviousFocusableItemIndex()
	{
		const { children } = this.props
		let { focusedItemIndex } = this.state

		if (focusedItemIndex === undefined) {
			focusedItemIndex = React.Children.count(children)
		}

		while (focusedItemIndex > 0) {
			focusedItemIndex--
			if (this.isFocusableItemIndex(focusedItemIndex)) {
				return focusedItemIndex
			}
		}
	}

	// Get the next option (relative to the currently focused option)
	getNextFocusableItemIndex()
	{
		const { children } = this.props
		let { focusedItemIndex } = this.state

		if (focusedItemIndex === undefined) {
			focusedItemIndex = -1
		}

		while (focusedItemIndex < React.Children.count(children) - 1) {
			focusedItemIndex++
			if (this.isFocusableItemIndex(focusedItemIndex)) {
				return focusedItemIndex
			}
		}
	}

	onItemFocus = (event) => {
		const { expandable } = this.props
		if (expandable) {
			return
		}
		this.onFocusIn()
	}

	onBlur = (event) => {
		const { expandable } = this.props
		if (expandable) {
			return
		}
		clearTimeout(this.blurTimer)
		const result = onBlur(event, this.onFocusOut, () => this.list)
		if (typeof result === 'number') {
			this.blurTimer = result
		}
	}

	onFocusIn = () => {
		this.setState({
			isFocused: true
		})
	}

	onFocusOut = () => {
		const { value } = this.props
		if (value === undefined) {
			this.clearFocus()
		}
		this.setState({
			isFocused: false
		})
	}

	isFocusableItemIndex = (index) => this.itemRefs[index] !== undefined

	isFocusableItem = (item) => item.type !== DividerType

	// `this.list` is also being accessed from `<ScrollableList/>`.
	storeListNode = (node) => this.list = node

	storeItemRef = (ref, i) => this.itemRefs[i] = ref

	render()
	{
		const
		{
			expandable,
			disabled,
			tabbable,
			value,
			hasOnChange,
			onChange,
			// `onSelectItem` is deprecated, use `onChange` instead.
			onSelectItem,
			highlightSelectedItem,
			ariaSelectedOnFocusedItem,
			createButtons,
			className,
			style,
			children
		}
		= this.props

		let { role } = this.props

		const {
			focusedItemIndex,
			isFocused
		} = this.state

		// ARIA (accessibility) roles info:
		// https://www.w3.org/TR/wai-aria-practices/examples/listbox/listbox-collapsible.html
		if (!role && (onChange || onSelectItem)) {
			role = 'listbox'
		}

		// if (this.props['aria-hidden']) {
		// 	role = undefined
		// }

		return (
			<ul
				ref={ this.storeListNode }
				onKeyDown={ this.onKeyDown }
				role={ role }
				aria-label={ this.props['aria-label'] }
				aria-hidden={ this.props['aria-hidden'] }
				aria-required={ this.props['aria-required'] }
				aria-invalid={ this.props['aria-invalid'] }
				style={ style }
				className={ classNames(className, 'rrui__list', {
					'rrui__list--focus': isFocused
				}) }>

				{ React.Children.map(children, (item, i) =>
				{
					if (item.type !== ItemType) {
						throw new Error(`Only <List.Item/>s can be placed inside a <List/> (and remove any whitespace).`)
					}

					return React.cloneElement(item,
					{
						key       : i,
						index     : i,
						itemRef   : this.isFocusableItem(item) ? this.storeItemRef : undefined,
						role      : role === 'listbox' ? 'option' : item.props.role,
						focus     : this.focusItem,
						focused   : (expandable || isFocused) && focusedItemIndex === i,
						disabled  : disabled || item.props.disabled,
						tabIndex  : tabbable && (focusedItemIndex === undefined ? i === 0 : i === focusedItemIndex) ? 0 : -1,
						createButton : createButtons,
						onItemFocus : this.onItemFocus,
						onItemBlur : this.onBlur,
						onSelectItem : onChange || onSelectItem,
						hasOnSelectItem : hasOnChange,
						selectedItemValue : value,
						highlightSelectedItem : (onChange || onSelectItem) && highlightSelectedItem,
						ariaSelectedOnFocusedItem
					})
				}) }
			</ul>
		)
	}
}

export class Item extends React.Component
{
	static propTypes =
	{
		value : PropTypes.any,
		index : PropTypes.number,
		focused : PropTypes.bool,
		onClick : PropTypes.func,
		// `onSelect` is deprecated, use `onClick` instead.
		onSelect : PropTypes.func,
		onSelectItem : PropTypes.func,
		// If a `<List/>` has `onChange` then it wraps `<List.Item/>`s with `<button/>`s.
		// The `onChange` added by `<ExpandableList/>` overrides the original `onChange`.
		// If there was no `onChange` — there will be one.
		// So to retain that info `hasOnChange` property is used as a workaround.
		// `undefined` means "ignore this property".
		hasOnSelectItem : PropTypes.bool,
		selectedItemValue : PropTypes.any,
		highlightSelectedItem : PropTypes.bool,
		// `role="combobox"` requires `aria-selected` to be
		// `true` on the currently focused list option.
		ariaSelectedOnFocusedItem : PropTypes.bool,
		createButton : PropTypes.bool,
		// Deprecated. Use `createButton` instead.
		shouldCreateButton : PropTypes.bool
	}

	onMouseDown = (event) =>
	{
		const
		{
			value,
			index,
			focus,
			children
		}
		= this.props

		// If `<List.Item/>` child element gets wrapped in a `<button/>`
		// then call `onMouseDown` defined on the `<List.Item/>`.
		// If `<List.Item/>` child element doesn't get wrapped in a `<button/>`
		// then manually call `onMouseDown` defined on the `<List.Item/>` child element
		// because `onMouseDown` gets overridden for `<List.Item/>` child element.

		const onMouseDown = this.shouldCreateButton() ? this.props.onMouseDown : children.props.onMouseDown

		// Without this Safari (both mobile and desktop)
		// won't select any item in an expanded list
		// because it will collapse the list immediately
		// on `mouseDown` due to `blur` event being fired.
		event.preventDefault()

		if (this.isSelectable()) {
			focus(index)
		}

		if (onMouseDown) {
			onMouseDown(event)
		}
	}

	onFocus = (event) =>
	{
		const
		{
			focus,
			index,
			onItemFocus,
			children
		}
		= this.props

		// If `<List.Item/>` child element gets wrapped in a `<button/>`
		// then call `onFocus` defined on the `<List.Item/>`.
		// If `<List.Item/>` child element doesn't get wrapped in a `<button/>`
		// then manually call `onFocus` defined on the `<List.Item/>` child element
		// because `onFocus` gets overridden for `<List.Item/>` child element.

		const onFocus = this.shouldCreateButton() ? this.props.onFocus : children.props.onFocus

		if (this.isSelectable()) {
			focus(index)
		}

		if (onFocus) {
			onFocus(event)
		}

		if (onItemFocus) {
			onItemFocus(event)
		}
	}

	onBlur = (event) =>
	{
		const { onItemBlur, children } = this.props

		// If `<List.Item/>` child element gets wrapped in a `<button/>`
		// then call `onBlur` defined on the `<List.Item/>`.
		// If `<List.Item/>` child element doesn't get wrapped in a `<button/>`
		// then manually call `onFocus` defined on the `<List.Item/>` child element
		// because `onBlur` gets overridden for `<List.Item/>` child element.

		const onBlur = this.shouldCreateButton() ? this.props.onBlur : children.props.onBlur

		if (onBlur) {
			onBlur(event)
		}

		if (onItemBlur) {
			onItemBlur(event)
		}
	}

	onClick = (event) =>
	{
		const
		{
			onClick,
			onSelect,
			onSelectItem,
			index,
			value,
			children
		}
		= this.props

		// If `<List.Item/>` child element gets wrapped in a `<button/>`
		// then call `onClick` defined on the `<List.Item/>`.
		// If `<List.Item/>` child element doesn't get wrapped in a `<button/>`
		// then manually call `onClick` defined on the `<List.Item/>` child element
		// because `onClick` gets overridden for `<List.Item/>` child element,
		// and also call `onClick` defined on the `<List.Item/>` (if any).

		if (onClick) {
			onClick(event)
		}

		if (!this.shouldCreateButton()) {
			// Since `onClick` gets overridden
			// for `<List.Item/>` child element
			// call its original `onClick` manually here.
			if (children.props.onClick) {
				children.props.onClick(event)
			}
		}

		if (this.isSelectable())
		{
			if (onSelect) {
				onSelect(value, index)
			}
			if (onSelectItem) {
				onSelectItem(value, index)
			}
		}
	}

	isSelectable()
	{
		const { children } = this.props
		return children.type !== DividerType
	}

	focus = () =>
	{
		const { children } = this.props

		focus(React.Children.toArray(children)[0])
	}

	storeRef = (ref) =>
	{
		const { itemRef, index } = this.props

		if (itemRef) {
			itemRef(ref, index)
		}
	}

	shouldCreateButton()
	{
		const {
			onClick,
			onSelect,
			onSelectItem,
			hasOnSelectItem,
			createButton,
			// Deprecated. Use `createButton` instead.
			shouldCreateButton
		} = this.props

		return this.isSelectable() && (
			onClick ||
			onSelect ||
			(
				onSelectItem &&
				(hasOnSelectItem === undefined ? true : hasOnSelectItem) &&
				(createButton || shouldCreateButton)
			)
		)
	}

	render()
	{
		const
		{
			value,
			icon,
			role,
			focused,
			disabled,
			className,
			tabIndex,
			highlightSelectedItem,
			ariaSelectedOnFocusedItem,
			selectedItemValue,
			children
		}
		= this.props

		// Throws an error for some weird reason.
		// React.Children.only(children)

		if (React.Children.count(children) !== 1) {
			throw new Error(`Each <List.Item/> must have a single child (and remove any whitespace).`)
		}

		const isSelected = this.shouldCreateButton() && value === selectedItemValue

		const properties =
		{
			ref          : this.storeRef,
			onMouseDown  : this.onMouseDown,
			onClick      : this.onClick,
			onFocus      : this.onFocus,
			onBlur       : this.onBlur,
			className    : classNames
			(
				className,
				'rrui__list__item',
				{
					/* `--focused` modifiers are deprecated, use `--focus` instead. */
					'rrui__list__item--focused'  : focused,
					'rrui__list__item--focus'    : focused,
					'rrui__list__item--selected' : isSelected && highlightSelectedItem,
					'rrui__list__item--disabled' : disabled,
					'rrui__list__item--divider'  : children.type === DividerType
				}
			)
		}

		let ItemComponent
		let itemChildren
		let label

		if (this.shouldCreateButton())
		{
			ItemComponent = 'button'
			label = this.props.label || (typeof children === 'string' ? children : undefined)
			properties.type = 'button'
			properties.role = role
			properties['aria-selected'] = ariaSelectedOnFocusedItem ? focused : isSelected
			properties['aria-label'] = this.props.label || (typeof children !== 'string' && children && children.props ? children.props['aria-label'] : undefined)
			properties.tabIndex = tabIndex
			properties.disabled = disabled
			properties.className = classNames(
				properties.className,
				'rrui__button-reset',
				'rrui__outline',
				'rrui__list__item--button'
			)

			// Replace `itemChildren` array with `<React.Fragment/>`
			// in some future when React >= 16.2.0 is common.
			//
			// <React.Fragment>
			// 	{/* Icon. */}
			// 	{ icon &&
			// 		<div className="rrui__list__item-icon">
			// 			{ React.createElement(icon, { value, label }) }
			// 		</div>
			// 	}
			//
			// 	{/* Label (or content). */}
			// 	{ children }
			// </React.Fragment>

			// Label (or content).
			itemChildren = React.Children.toArray(children)

			// Icon.
			if (icon)
			{
				itemChildren.unshift((
					<span key='icon' className="rrui__list__item-icon">
						{ React.createElement(icon, { value, label }) }
					</span>
				))
			}
		}
		else
		{
			// Don't overwrite `className` already defined on the `children`.
			properties.className = classNames(properties.className, children.props && children.props.className)
		}

		return (
			<li
				role={this.shouldCreateButton() || children.type === DividerType ? 'presentation' : role}
				aria-selected={this.shouldCreateButton() ? undefined : (role && role !== 'presentation' ? (ariaSelectedOnFocusedItem ? focused : isSelected) : undefined)}
				aria-label={this.shouldCreateButton() ? undefined : label}
				className="rrui__list__list-item">
				{ ItemComponent && React.createElement(ItemComponent, properties, itemChildren) }
				{ !ItemComponent && React.cloneElement(children, properties) }
			</li>
		)
	}
}

List.Item = Item

// Workaround for `react-hot-loader`.
// https://github.com/gaearon/react-hot-loader#checking-element-types
const ItemType = <Item/>.type

function haveItemsChanged(props, prevProps)
{
	const items     = React.Children.toArray(props.children)
	const prevItems = React.Children.toArray(prevProps.children)

	if (items.length !== prevItems.length) {
		return true
	}

	let i = 0
	while (i < items.length)
	{
		if (items[i].props.value !== prevItems[i].props.value) {
			return true
		}
		i++
	}

	return false
}

export function findItemIndexByValue(value, children)
{
	const items = React.Children.toArray(children)

	let i = 0
	for (const item of items)
	{
		if (item.props.value === value) {
			return i
		}
		i++
	}

	// The item could be missing due to being trimmed by `maxOptions` in `Autocomplete`.
	// console.error(`Item with value ${value} not found in a <List/>. Available values: ${items.length > 0 ? items.map(_ => _.props.value).join(', ') : '(none)'}.`)
}