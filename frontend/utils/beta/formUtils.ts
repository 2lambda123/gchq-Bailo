import { Validator } from 'jsonschema'
import dropRight from 'lodash/dropRight'
import get from 'lodash/get'
import omit from 'lodash/omit'
import remove from 'lodash/remove'
import { cloneDeep } from 'lodash-es'
import { Dispatch, SetStateAction } from 'react'
import CustomTextInput from 'src/MuiForms/CustomTextInput'
import DateSelector from 'src/MuiForms/DateSelector'
import Dropdown from 'src/MuiForms/Dropdown'
import EntitySelector from 'src/MuiForms/EntitySelector'
import EntitySelectorBeta from 'src/MuiForms/EntitySelectorBeta'
import Nothing from 'src/MuiForms/Nothing'
import RichTextInput from 'src/MuiForms/RichTextInput'
import SeldonVersionSelector from 'src/MuiForms/SeldonVersionSelector'
import TagSelector from 'src/MuiForms/TagSelector'
import TagSelectorBeta from 'src/MuiForms/TagSelectorBeta'
import UserSelector from 'src/MuiForms/UserSelector'

import { SplitSchemaNoRender, StepNoRender, StepType } from '../../types/interfaces'
import { createUiSchema } from '../uiSchemaUtils'

export const widgets = {
  TextWidget: CustomTextInput,
  TextareaWidget: RichTextInput,
  DateWidget: DateSelector,
  tagSelector: TagSelector,
  tagSelectorBeta: TagSelectorBeta,
  userSelector: UserSelector,
  entitySelector: EntitySelector,
  entitySelectorBeta: EntitySelectorBeta,
  SelectWidget: Dropdown,
  seldonVersionSelector: SeldonVersionSelector,
  nothing: Nothing,
}

export function createStep({
  schema,
  uiSchema,
  state,
  type,
  section,
  index,
  schemaRef,
  isComplete,
}: {
  schema: any
  uiSchema?: any
  state: unknown
  type: StepType
  section: string
  index: number
  schemaRef: string
  isComplete: (step: StepNoRender) => boolean
}): StepNoRender {
  return {
    schema,
    uiSchema,
    state,
    type,
    index,

    section,
    schemaRef,

    shouldValidate: false,

    isComplete,
  }
}

export function setStepState(
  _splitSchema: SplitSchemaNoRender,
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>,
  step: StepNoRender,
  state: any,
) {
  setSplitSchema((oldSchema) => {
    const index = oldSchema.steps.findIndex((iStep) => step.section === iStep.section)

    const duplicatedSteps = [...oldSchema.steps]
    duplicatedSteps[index].state = {
      ...(oldSchema.steps[index].state || {}),
      ...state,
    }

    for (const duplicatedStep of duplicatedSteps) {
      duplicatedStep.steps = duplicatedSteps
    }

    return { ...oldSchema, steps: duplicatedSteps }
  })
}

export function setStepValidate(
  splitSchema: SplitSchemaNoRender,
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>,
  step: StepNoRender,
  validate: boolean,
) {
  const index = splitSchema.steps.findIndex((iStep) => step.section === iStep.section)

  const duplicatedSteps = [...splitSchema.steps]
  duplicatedSteps[index].shouldValidate = validate

  for (const duplicatedStep of duplicatedSteps) {
    duplicatedStep.steps = duplicatedSteps
  }

  setSplitSchema({ ...splitSchema, steps: duplicatedSteps })
}

export function getStepsFromSchema(
  schema: any,
  baseUiSchema: any = {},
  omitFields: Array<string> = [],
  state: any = {},
): Array<StepNoRender> {
  const schemaDupe = omit(schema.jsonSchema, omitFields) as any

  for (const field of omitFields) {
    const fields = field.split('.')
    remove(get(schemaDupe, `${dropRight(fields, 2).join('.')}.required`, []), (v) => v === fields[fields.length - 1])
  }

  const uiSchema = createUiSchema(schemaDupe, baseUiSchema)
  const props = Object.keys(schemaDupe.properties).filter((key) =>
    ['object', 'array'].includes(schemaDupe.properties[key].type),
  )

  const steps: Array<StepNoRender> = []
  props.forEach((prop: any, index: number) => {
    const createdStep = createStep({
      schema: {
        definitions: schemaDupe.definitions,
        ...schemaDupe.properties[prop],
      },
      uiSchema: uiSchema[prop],
      state: state[prop] || {},
      type: 'Form',
      index,
      schemaRef: schema.reference,

      section: prop,
      isComplete: validateForm,
    })

    steps.push(createdStep)
  })

  return steps
}

export function getStepsData(splitSchema: SplitSchemaNoRender, includeAll = false) {
  const data: any = {}

  splitSchema.steps.forEach((step) => {
    if (!includeAll && step.type !== 'Form') return

    data[step.section] = step.state
  })

  // Make sure not to return a weak reference to the underlying steps
  return cloneDeep(data)
}

export function setStepsData(
  splitSchema: SplitSchemaNoRender,
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>,
  data: any,
) {
  const newSteps = splitSchema.steps.map((step) => {
    if (!data[step.section]) return { ...step }
    if (step.type !== 'Form') return { ...step }

    return {
      ...step,
      state: data[step.section],
    }
  })

  for (const step of newSteps) {
    step.steps = newSteps
  }

  setSplitSchema({ ...splitSchema, steps: newSteps })
}

export function validateForm(step: StepNoRender) {
  const validator = new Validator()
  const sectionErrors = validator.validate(step.state, step.schema)

  return sectionErrors.errors.length === 0
}
