import React, {Component, PropTypes} from 'react'

import { amount } from '../../utils/amount'

import classNames from 'classnames/bind'
import styles from './Amount.scss'
const cx = classNames.bind(styles)

export default class Amount extends Component {
  static propTypes = {
    amount: PropTypes.number,
    currencySymbol: PropTypes.string
  }

  render() {
    const { currencySymbol } = this.props

    const am = amount(this.props.amount, currencySymbol)

    return (
      <span>
        {am.integer}.<sup className={cx('fractional')}>{am.fractional}</sup>
      </span>
    )
  }
}
