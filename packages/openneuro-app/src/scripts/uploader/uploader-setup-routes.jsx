import React from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router-dom'
import UploaderModal from './uploader-modal.jsx'
import UploadStep from './upload-step.jsx'
import UploadSelect from './upload-select.jsx'
import UploadRename from './upload-rename.jsx'
import UploadIssues from './upload-issues.jsx'
import UploadDisclaimer from './upload-disclaimer.jsx'

const UploaderSetupRoutes = props => (
  <UploaderModal {...props}>
    <UploadStep location={props.location} />
    <div className="tasks-col fade-in">
      <div id="upload-tabs" className="uploader container">
        <Switch location={props.location}>
          <Route
            name="upload-select"
            path="/upload"
            exact
            component={UploadSelect}
          />
          <Route
            name="upload-rename"
            path="/upload/rename"
            exact
            component={UploadRename}
          />
          <Route
            name="upload-issues"
            path="/upload/issues"
            exact
            component={UploadIssues}
          />
          <Route
            name="upload-disclaimer"
            path="/upload/disclaimer"
            exact
            component={UploadDisclaimer}
          />
        </Switch>
      </div>
    </div>
  </UploaderModal>
)

UploaderSetupRoutes.propTypes = {
  location: PropTypes.object,
}

export default UploaderSetupRoutes
