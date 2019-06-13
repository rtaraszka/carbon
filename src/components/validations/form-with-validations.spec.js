import React from 'react';
import { shallow } from 'enzyme';
import { withValidations } from '.';
import validator from '../../utils/validations/validator';
import VALIDATION_TYPES from './validation-types.config';

const error = Error('this value is required!');

const presence = value => new Promise((resolve, reject) => {
  if (value) return resolve(true);
  return reject(error);
});

const passValidation = () => new Promise((resolve) => {
  resolve(true);
});

const mockCountCall = (context, type, validationResult) => {
  return context.adjustCount(type, validationResult);
};

const mockRegisterChild = (context, name, validateFunction) => {
  context.addInput(name, validateFunction);
};

const mockUnregisterChild = (context, name) => context.removeInput(name);

const MockComponent = props => <form { ...props } />;

const WithNoName = withValidations(() => <form />);

describe('when the formWithValidations HOC is wraps a component', () => {
  let wrapper, context;

  const ChildWithValidation = MockComponent;
  const ComponentWithValidations = withValidations(MockComponent);
  beforeEach(() => {
    wrapper = shallow(
      <ComponentWithValidations>
        <ChildWithValidation
          name='foo'
          validations={ presence }
          warnings={ presence }
          info={ presence }
          value='foo'
        />
        <ChildWithValidation
          name='bar'
          validations={ presence }
          warnings={ presence }
          info={ presence }
          value=''
        />
      </ComponentWithValidations>
    );
    context = wrapper.instance().getContext();
  });

  it('matches the snapshot, rendering with default props for each of its children', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('matches the snapshot when the it is passed an anonymous component with no name or display name', () => {
    wrapper = shallow(<WithNoName />);
    expect(wrapper).toMatchSnapshot();
  });

  it('passes context to allow inputs to register themselves', () => {
    wrapper.instance().props.children.forEach((child) => {
      return mockRegisterChild(context, child.props.name, child.props.validations);
    });
    expect(Object.keys(wrapper.instance().inputs).length).toEqual(2);
    wrapper.instance().props.children
      .forEach(child => expect(wrapper.instance().inputs[child.props.name]).not.toEqual(undefined));
  });

  it('passes context to allow inputs to unregister themselves', () => {
    wrapper.instance().props.children.forEach((child) => {
      return mockRegisterChild(context, child.props.name, child.props.validations);
    });
    wrapper.instance().props.children.forEach((child) => {
      return mockUnregisterChild(context, child.props.name);
    });
    expect(Object.keys(wrapper.instance().inputs).length).toEqual(0);
    wrapper.instance().props.children
      .forEach(child => expect(wrapper.instance().inputs[child.props.name]).toEqual(undefined));
  });

  describe('when the context is used to adjust the validation counts', () => {
    it('increments the validations count when failed validation is detected', async () => {
      const { children } = wrapper.instance().props;
      const { inputs } = wrapper.instance();
      await children.forEach((child) => {
        mockRegisterChild(context, child.props.name, child.props.validations);
        return inputs[child.props.name](child.props.value).catch(() => mockCountCall(context, 'error', true));
      });
      expect(wrapper.instance().state.errorCount).toEqual(1);
    });

    it('increments the warnings count when failed validation is detected', async () => {
      const { children } = wrapper.instance().props;
      const { inputs } = wrapper.instance();
      await children.forEach((child) => {
        mockRegisterChild(context, child.props.name, child.props.warnings);
        return inputs[child.props.name](child.props.value).catch(() => mockCountCall(context, 'warning', true));
      });
      expect(wrapper.instance().state.warningCount).toEqual(1);
    });

    it('increments the info count when failed validation is detected', async () => {
      const { children } = wrapper.instance().props;
      const { inputs } = wrapper.instance();
      await children.forEach((child) => {
        mockRegisterChild(context, child.props.name, child.props.info);
        return inputs[child.props.name](child.props.value).catch(() => mockCountCall(context, 'info', true));
      });
      expect(wrapper.instance().state.infoCount).toEqual(1);
    });

    it('does nothing to any of the counts when an invalid validation type is passed to the component', async () => {
      const { children } = wrapper.instance().props;
      const { inputs } = wrapper.instance();
      await children.forEach((child) => {
        mockRegisterChild(context, child.props.name, child.props.info);
        return inputs[child.props.name](child.props.value).catch(() => mockCountCall(context, 'foo', true));
      });
      expect(wrapper.instance().state.errorCount).toEqual(0);
      expect(wrapper.instance().state.warningCount).toEqual(0);
      expect(wrapper.instance().state.infoCount).toEqual(0);
    });

    it('decrements the count when the state value is greater or equal to zero and there is no failures', async () => {
      const { children } = wrapper.instance().props;
      const { inputs } = wrapper.instance();
      wrapper.setState({ errorCount: 3, warningCount: 2, infoCount: 1 });
      await children.forEach((child) => {
        mockRegisterChild(context, child.props.name, child.props.info);
        return inputs[child.props.name](child.props.value).catch(() => {
          mockCountCall(context, 'error');
          mockCountCall(context, 'warning');
          mockCountCall(context, 'info');
        });
      });
      expect(wrapper.instance().state.errorCount).toEqual(2);
      expect(wrapper.instance().state.warningCount).toEqual(1);
      expect(wrapper.instance().state.infoCount).toEqual(0);
    });
  });

  describe('when it runs the validation for each of the registered children', () => {
    let index = 0;

    const mockRunValidation = (type) => {
      const child = wrapper.instance().props.children[index];
      const validationType = VALIDATION_TYPES[type];

      return new Promise(async (resolve) => {
        const validate = await validator(child.props[validationType]);
        return validate(child.props.value)
          .then(() => {
            return resolve(true);
          })
          .catch(() => {
            return resolve(false);
          });
      });
    };

    const mockValidate = (types) => {
      const validationPromises = [];
      types.forEach((type) => {
        const validationPromise = mockRunValidation(type);
        if (validationPromise) validationPromises.push(validationPromise);
      });
      index += 1;
      return validationPromises;
    };

    it('resolves false when all children fail their validations', async () => {
      index = 0;
      wrapper = shallow(
        <ComponentWithValidations>
          <ChildWithValidation
            name='foo'
            validations={ [presence] }
          />
          <ChildWithValidation
            name='bar'
            validations={ presence }
          />
          <ChildWithValidation
            name='wiz'
            validations={ presence }
          />
        </ComponentWithValidations>
      );
      const { children } = wrapper.instance().props;
      context = wrapper.instance().getContext();

      children.forEach(child => mockRegisterChild(context, child.props.name, mockValidate));
      await expect(wrapper.instance().validateRegisteredInputs()).resolves.toEqual(false);
    });

    it('resolves true when all children components passes their validations', async () => {
      index = 0;
      wrapper = shallow(
        <ComponentWithValidations>
          <ChildWithValidation
            name='foo'
            validations={ passValidation }
          />
          <ChildWithValidation
            name='bar'
            validations={ [passValidation] }
          />
          <ChildWithValidation
            name='wiz'
            validations={ passValidation }
          />
        </ComponentWithValidations>
      );
      const { children } = wrapper.instance().props;
      context = wrapper.instance().getContext();

      children.forEach(child => mockRegisterChild(context, child.props.name, mockValidate));
      await expect(wrapper.instance().validateRegisteredInputs()).resolves.toEqual(true);
    });

    it('resolves false when any of the children components fail any of their validations', async () => {
      index = 0;
      wrapper = shallow(
        <ComponentWithValidations>
          <ChildWithValidation
            name='foo'
            validations={ passValidation }
          />
          <ChildWithValidation
            name='bar'
            validations={ [passValidation, presence] }
          />
          <ChildWithValidation
            name='wiz'
            validations={ passValidation }
          />
        </ComponentWithValidations>
      );
      const { children } = wrapper.instance().props;
      context = wrapper.instance().getContext();

      children.forEach(child => mockRegisterChild(context, child.props.name, mockValidate));
      await expect(wrapper.instance().validateRegisteredInputs()).resolves.toEqual(false);
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });
});
