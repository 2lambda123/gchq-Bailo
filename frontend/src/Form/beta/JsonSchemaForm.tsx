import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Stepper,
  Typography,
} from '@mui/material'
import Form from '@rjsf/mui'
import { ArrayFieldTemplateProps, RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { Dispatch, SetStateAction, useState } from 'react'

import { SplitSchemaNoRender } from '../../../types/interfaces'
import { setStepState } from '../../../utils/beta/formUtils'
import { widgets } from '../../../utils/beta/formUtils'
import ValidationErrorIcon from '../../model/beta/common/ValidationErrorIcon'
import Nothing from '../../MuiForms/Nothing'

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography fontWeight='bold' variant='h5' component='h3'>
        {props.title}
      </Typography>
      {props.items.map((element) => (
        <Grid key={element.key} container spacing={2}>
          <Grid item xs={11}>
            <Box>{element.children}</Box>
          </Grid>
          <Grid item xs={1}>
            {props.formContext.editMode && (
              <IconButton size='small' type='button' onClick={element.onDropIndexClick(element.index)}>
                <RemoveIcon color='error' />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}
      {props.canAdd && props.formContext.editMode && (
        <Button size='small' type='button' onClick={props.onAddClick} startIcon={<AddIcon />}>
          Add Item
        </Button>
      )}
    </Card>
  )
}

function DescriptionFieldTemplate() {
  return <></>
}

// TODO - add validation BAI-866
export default function JsonSchemaForm({
  splitSchema,
  setSplitSchema,
  canEdit = false,
  displayLabelValidation = false,
  defaultCurrentUserInEntityList = false,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  canEdit?: boolean
  displayLabelValidation?: boolean
  defaultCurrentUserInEntityList?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const onFormChange = (form: RJSFSchema) => {
    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }

  function handleListItemClick(index: number) {
    setActiveStep(index)
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={3} md={2}>
        <Stepper activeStep={activeStep} nonLinear alternativeLabel orientation='vertical' connector={<Nothing />}>
          <List sx={{ width: { xs: '100%' } }}>
            {splitSchema.steps.map((step, index) => (
              <ListItem key={step.schema.title} disablePadding>
                <ListItemButton selected={activeStep === index} onClick={() => handleListItemClick(index)}>
                  <Stack direction='row' spacing={2}>
                    <Typography>{step.schema.title}</Typography>
                    {displayLabelValidation && <ValidationErrorIcon step={step} />}
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stepper>
      </Grid>
      <Divider orientation='vertical' flexItem sx={{ mr: '-1px' }} />
      <Grid item xs={12} sm={9} md={10}>
        <Form
          schema={currentStep.schema}
          formData={currentStep.state}
          onChange={onFormChange}
          validator={validator}
          widgets={widgets}
          uiSchema={currentStep.uiSchema}
          liveValidate={currentStep.shouldValidate}
          omitExtraData
          disabled={!canEdit}
          liveOmit
          formContext={{
            editMode: canEdit,
            formSchema: currentStep.schema,
            defaultCurrentUser: defaultCurrentUserInEntityList,
          }}
          templates={
            !canEdit
              ? {
                  DescriptionFieldTemplate,
                  ArrayFieldTemplate,
                }
              : { ArrayFieldTemplate }
          }
        >
          {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
          <></>
        </Form>
      </Grid>
    </Grid>
  )
}
