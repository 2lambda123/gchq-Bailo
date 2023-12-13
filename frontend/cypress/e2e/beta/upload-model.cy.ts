import getUuidFromUrl from '../../utils/getUuidFromUrl'

const newModelUrl = '/beta/model/new'

let modelUuid = ''
const schemaId = 'minimal-general-v10-beta'

describe('Beta create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(newModelUrl)
    cy.contains('Upload a new Model')
  })

  it('creates a public new model', () => {
    cy.visit(newModelUrl)

    cy.get('[data-test=modelNameInput]').type('test model')
    cy.get('[data-test=modelDescriptionInput]').type('test description')

    cy.get('[data-test=publicButtonSelector]').click()
    cy.get('[data-test=createModelButton]').click()
    cy.get('[data-test=createModelCardOverview]')

    cy.log('Checking URL has been updated')
    cy.url()
      .as('modelUrl')
      .should('contain', `/model/`)
      .then((url) => {
        modelUuid = getUuidFromUrl(url)
      })
  })

  it('creates a private new model', () => {
    cy.log('Navigating to the new model page')
    cy.visit(newModelUrl)

    cy.log('Filling out the form to make a private model and submitting')
    cy.get('[data-test=modelNameInput]').type('test model')
    cy.get('[data-test=modelDescriptionInput]').type('test description')

    cy.get('[data-test=privateButtonSelector]').click()
    cy.get('[data-test=createModelButton]').click()
    cy.get('[data-test=createModelCardOverview]')
  })

  it('can set a schema for a newly created model', () => {
    cy.visit(`/beta/model/${modelUuid}`)
    cy.contains('Create a model card')
    cy.get('[data-test=createSchemaFromScratchButton]').click()
    cy.log('Checking URL has been updated')
    cy.url().should('contain', `/beta/model/${modelUuid}/schema`)
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click({
      multiple: true,
      force: true,
    })
    cy.contains('Edit Model card')
  })

  it('can edit an existing model', () => {
    cy.log('Navigating to an existing model')
    cy.visit(`/beta/model/${modelUuid}`)
    cy.contains('Edit Model card')
    cy.log('Test that we can edit the model card')
    cy.get('[data-test=editModelCardButton]').click()
    cy.get('#root_modelSummary').type('This is a test summary')
    cy.get('[data-test=cancelEditModelCardButton]').click()
    cy.contains('This is a test summary').should('not.exist')
    cy.get('[data-test=editModelCardButton]').click()
    cy.get('#root_modelSummary').type('This is a test summary')
    cy.get('[data-test=saveModelCardButton]').click()
    cy.contains('This is a test summary')
  })
})
