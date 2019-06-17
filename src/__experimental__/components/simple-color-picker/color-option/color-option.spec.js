import React from 'react';
import { shallow } from 'enzyme';
import 'jest-styled-components';
import TestRenderer from 'react-test-renderer';
import ColorOption from './color-option.component';
import StyledColorOption from './style/color-option.style';
import StyledColorSampleBox from '../color-sample-box/style/color-sample-box.style';
import { assertStyleMatch } from '../../../../__spec_helper__/test-utils';
import { rootTagTest } from '../../../../utils/helpers/tags/tags-specs/tags-specs';
import classicTheme from '../../../../style/themes/classic';

function render(props, renderer = shallow) {
  return renderer(<ColorOption
    name='color-picker' color='#0073C2'
    { ...props }
  />);
}

function renderStyles(props) {
  return TestRenderer.create(<StyledColorOption
    name='color-picker' color='#0073C2'
    { ...props }
  />);
}

describe('ColorOption', () => {
  let wrapper;

  describe('unchecked option', () => {
    it('contains input and color sample box', () => {
      wrapper = render();
      expect(wrapper.children()).toHaveLength(2);
    });
  });

  it('applies color mixed with 20% of black on hover', () => {
    wrapper = renderStyles();
    assertStyleMatch(
      {
        backgroundColor: '#005C9B'
      },
      wrapper.toJSON(),
      { modifier: `:hover ${StyledColorSampleBox}` }
    );
  });

  describe('tags on component', () => {
    it('include correct component, element and role data tags', () => {
      wrapper = shallow(<ColorOption data-element='bar' data-role='baz' />);
      rootTagTest(wrapper, 'color-option', 'bar', 'baz');
    });
  });

  describe('in classic theme', () => {
    it('does not change the background color on hover', () => {
      wrapper = renderStyles({ theme: classicTheme });
      assertStyleMatch(
        {
          backgroundColor: '#0073C2'
        },
        wrapper.toJSON(),
        { modifier: `:hover ${StyledColorSampleBox}` }
      );
    });
  });
});
