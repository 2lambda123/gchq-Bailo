import { findSchemaByRef } from '../services/schema.js'
import { BadReq } from '../utils/result.js'


//getMetadataSchema function here , import into import model
export async function getMetadataSchema(metadata: any) {
    const schema = await findSchemaByRef(metadata.schemaRef)
    if (!schema) {
      //TODO replace throw BadReq to create schema
        throw BadReq({ code: 'schema_not_found', schemaRef: metadata.schemaRef }, 'Schema not found')
    }
  
    return schema
  }