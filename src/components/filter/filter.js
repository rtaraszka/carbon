import React from 'react';
import classNames from 'classnames';

/**
 * @class Filter
 * @constructor
 */
class Filter extends React.Component {
  static propTypes = {
    /**
     * Aligns the children in the filter.
     *
     * @property align
     * @type {String}
     * @default left
     */
    align: React.PropTypes.string
  }

  static defaultProps = {
    align: 'left'
  }

  /**
   * Handles the submission of the form.
   *
   * @method handleSubmit
   * @param {Object}
   */
  handleSubmit = (ev) => {
    ev.preventDefault();
  }

  /**
   * Returns the classes for the filter.
   *
   * @method classes
   * @return {String}
   */
  get classes() {
    return classNames(
      'ui-filter',
      this.props.className,
      `ui-filter--align-${this.props.align}`
    );
  }


  /**
   * @method render
   * @return {Object} JSX
   */
  render() {
    return (
      <form className={ this.classes } onSubmit={ this.handleSubmit }>
        { this.props.children }
      </form>
    );
  }
}

export default Filter;
