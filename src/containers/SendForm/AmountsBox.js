import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'
import { amountsChange, requestQuote } from 'redux/actions/send'

import classNames from 'classnames/bind'
import styles from './SendForm.scss'
const cx = classNames.bind(styles)

import Input from 'components/Input/Input'

@connect(
  state => ({
    user: state.auth.user,
    sourceAmount: state.send.sourceAmount,
    destinationAmount: state.send.destinationAmount,
    destinationInfo: state.send.destinationInfo,
    config: state.auth.config,
    quoting: state.send.quoting,
    quote: state.send.quote,
    err: state.send.err
  }),
  { amountsChange, requestQuote })
export default class AmountsBox extends Component {
  static propTypes = {
    // State
    user: PropTypes.object.isRequired,
    config: PropTypes.object,
    sourceAmount: PropTypes.number,
    destinationAmount: PropTypes.number,
    destinationInfo: PropTypes.object,
    amountsChange: PropTypes.func,
    requestQuote: PropTypes.func.isRequired,
    quote: PropTypes.object,
    quoting: PropTypes.bool,
    err: PropTypes.object,

    // Props
    sourceAmountField: PropTypes.object,
    destinationAmountField: PropTypes.object
  }

  componentWillReceiveProps(nextProps) {
    // Amounts didn't change, ignore the rest
    if (this.props.sourceAmount === nextProps.sourceAmount
      && this.props.destinationAmount === nextProps.destinationAmount) {
      return
    }

    // Update the inputs
    nextProps.sourceAmountField.onChange(nextProps.sourceAmount || '') // null values don't work with redux-form
    nextProps.destinationAmountField.onChange(nextProps.destinationAmount || '')

    // Quoting requires a destination
    if (!nextProps.destinationInfo.identifier) return

    // At least one amount should be specified
    if (!nextProps.sourceAmount && !nextProps.destinationAmount) return

    // if both amounts are specified then the change is triggered by a quote response, so no need to do anything else
    if (nextProps.sourceAmount && nextProps.destinationAmount) return

    // Request a quote
    nextProps.requestQuote({
      destination: nextProps.destinationInfo.identifier,
      sourceAmount: nextProps.sourceAmount,
      destinationAmount: nextProps.destinationAmount
    })

    this.lastQuotingField = nextProps.sourceAmount ? 'source' : 'destination'
  }

  handleInputChange = (type, target) => {
    if (this.props[type + 'AmountField'].invalid) return

    const value = parseFloat(target.value)

    const sourceValue = type === 'source' ? value : null
    const destinationValue = type === 'destination' ? value : null

    this.props.amountsChange(sourceValue, destinationValue)
  }

  render() {
    const { destinationInfo, quoting, config, err,
      sourceAmountField, destinationAmountField } = this.props

    const isSendingAmountDisabled = !destinationInfo.identifier
      || err.id === 'NotFoundError'
      || (quoting && this.lastQuotingField === 'destination')
    const isReceivingAmountDisabled = !destinationInfo.identifier
      || err.id === 'NotFoundError'
      || (quoting && this.lastQuotingField === 'source')

    const sourceCurrency = config.currencySymbol
    const destinationCurrency = (destinationInfo && destinationInfo.currencySymbol) || config.currencySymbol

    return (
      <div className="row">
        <div className="col-sm-6 form-group">
          <label>You Send</label>
          <div className={cx('input-group',
            {disabled: isSendingAmountDisabled},
            {focused: sourceAmountField.active})}>
            <span className="input-group-addon">{sourceCurrency}</span>
            <Input object={sourceAmountField} size="lg"
                   disabled={isSendingAmountDisabled} noErrors debounce
                   onChange={this.handleInputChange.bind(this, 'source')} />
          </div>

          {sourceAmountField.dirty && sourceAmountField.error &&
            <div className="text-danger">{sourceAmountField.error}</div>}
        </div>
        <div className="col-sm-6 form-group">
          <label>They Receive</label>
          <div className={cx('input-group',
            {disabled: isReceivingAmountDisabled},
            {focused: destinationAmountField.active})}>
            <span className="input-group-addon">{destinationCurrency}</span>
            <Input object={destinationAmountField} size="lg"
                   disabled={isReceivingAmountDisabled} noErrors debounce
                   onChange={this.handleInputChange.bind(this, 'destination')} />
          </div>

          {destinationAmountField.dirty && destinationAmountField.error &&
            <div className="text-danger">{destinationAmountField.error}</div>}
        </div>
      </div>
    )
  }
}
