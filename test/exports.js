import
{
	PageAndMenu,
	Page,
	Menu,
	MenuButton,
	Form,
	Snackbar,
	Tooltip,
	ActivityIndicator,
	TextInput,
	Select,
	Button,
	Switch,
	Checkbox,
	SegmentedControl,
	DatePicker,
	FileUpload,
	Modal
}
from '../index.es6'

import { expect } from 'chai'

describe('React Responsive UI', function()
{
	it('should export ES6', function()
	{
		expect(PageAndMenu).to.be.a('function')
		expect(Page).to.be.a('function')
		expect(Menu).to.be.a('function')
		expect(MenuButton).to.be.a('function')
		expect(Form).to.be.a('function')
		expect(Snackbar).to.be.a('function')
		expect(Tooltip).to.be.a('function')
		expect(ActivityIndicator).to.be.a('function')
		expect(TextInput).to.be.a('function')
		expect(Select).to.be.a('function')
		expect(Button).to.be.a('function')
		expect(Switch).to.be.a('function')
		expect(Checkbox).to.be.a('function')
		expect(SegmentedControl).to.be.a('function')
		expect(DatePicker).to.be.a('function')
		expect(FileUpload).to.be.a('function')
		expect(Modal).to.be.a('function')
	})

	it('should export CommonJS', function()
	{
		const _ = require('../index.common')

		expect(_.PageAndMenu).to.be.a('function')
		expect(_.Page).to.be.a('function')
		expect(_.Menu).to.be.a('function')
		expect(_.MenuButton).to.be.a('function')
		expect(_.Form).to.be.a('function')
		expect(_.Snackbar).to.be.a('function')
		expect(_.Tooltip).to.be.a('function')
		expect(_.ActivityIndicator).to.be.a('function')
		expect(_.TextInput).to.be.a('function')
		expect(_.Select).to.be.a('function')
		expect(_.Button).to.be.a('function')
		expect(_.Switch).to.be.a('function')
		expect(_.Checkbox).to.be.a('function')
		expect(_.SegmentedControl).to.be.a('function')
		expect(_.DatePicker).to.be.a('function')
		expect(_.FileUpload).to.be.a('function')
		expect(_.Modal).to.be.a('function')
	})
})