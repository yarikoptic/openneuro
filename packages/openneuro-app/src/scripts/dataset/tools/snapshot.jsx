import React from 'react'
import PropTypes from 'prop-types'
import Reflux from 'reflux'
import Spinner from '../../common/partials/spinner.jsx'
import Timeout from '../../common/partials/timeout.jsx'
import ErrorBoundary from '../../errors/errorBoundary.jsx'
import moment from 'moment'
import semver from 'semver'
import actions from '../dataset.actions'
import datasetStore from '../dataset.store'
import bids from '../../utils/bids'
import { Link, withRouter } from 'react-router-dom'
import { refluxConnect } from '../../utils/reflux'
import { graphql } from 'react-apollo'
import { datasets as openneuroDatasets } from 'openneuro-client'

class Snapshot extends Reflux.Component {
  constructor(props) {
    super(props)
    refluxConnect(this, datasetStore, 'datasets')

    this.state = {
      changes: [],
      currentChange: '',
      selectedVersion: '1.0.0',
      minor: '1.0.0',
      major: '1.0.0',
      patch: '1.0.0',
      latestVersion: '',
    }
    this._handleChange = this.handleChange.bind(this)
    this._handleVersion = this.handleVersion.bind(this)
    this._addChange = this.submitChange.bind(this)
    this._removeChange = this.removeChange.bind(this)
    this._submit = this.submit.bind(this)
    this._onHide = this.onHide.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    let reload = false
    let datasetId = nextProps.match.params.datasetId
    let snapshotId = nextProps.match.params.snapshotId
    let snapshots = this.state.datasets.snapshots

    // get the tags that have semantic versions
    let semverTags = snapshots.filter(s => semver.valid(s.tag))

    // get the highest version
    let highestVersionedSnapshot = semverTags.sort((a, b) =>
      semver.lt(a.tag, b.tag),
    )[0]

    // set the major, minor, and breaking version numbers
    // if this is the first version, all of them are 1.0.0
    let major, minor, patch
    if (semverTags.length) {
      minor = semver.inc(highestVersionedSnapshot.tag, 'minor')
      patch = semver.inc(highestVersionedSnapshot.tag, 'patch')
      major = semver.inc(highestVersionedSnapshot.tag, 'major')
    } else {
      major = minor = patch = '1.0.0'
    }

    if (snapshotId) {
      const snapshotUrl = bids.encodeId(datasetId, snapshotId)
      if (snapshotUrl !== this.state.datasets.loadedUrl) {
        reload = true
      }
    } else {
      const datasetUrl = bids.encodeId(datasetId)
      if (datasetUrl !== this.state.datasets.loadedUrl) {
        reload = true
      }
    }

    if (reload) {
      this._loadData(
        nextProps.match.params.datasetId,
        nextProps.match.params.snapshotId,
      )
    }

    this.setState({
      selectedVersion: patch,
      major: major,
      patch: patch,
      minor: minor,
      changes: [],
      currentChange: '',
    })
  }

  componentDidMount() {
    const datasetId = this.props.match.params.datasetId
    const snapshotId = this.props.match.params.snapshotId
    this._loadData(datasetId, snapshotId)
  }

  _loadData(datasetId, snapshotId) {
    const query = new URLSearchParams(this.props.location.search)
    if (snapshotId) {
      const app = query.get('app')
      const version = query.get('version')
      const job = query.get('job')
      const snapshotUrl = datasetId.join(snapshotId, ':')
      actions.trackView(bids.decodeId(datasetId), bids.decodeId(snapshotId))
      actions.loadDataset(snapshotUrl, {
        snapshot: true,
        app: app,
        version: version,
        job: job,
        datasetId: bids.encodeId(datasetId),
      })
    } else if (
      (datasetId && !this.state.datasets.dataset) ||
      (datasetId && datasetId !== this.state.datasets.dataset._id)
    ) {
      actions.loadDataset(bids.encodeId(datasetId))
    }
  }

  handleChange(e) {
    let value = e.currentTarget.value
    this.setState({
      currentChange: value,
    })
  }

  handleVersion(e) {
    let value = e.currentTarget.value
    this.setState({
      selectedVersion: value,
    })
  }

  _formContent() {
    if (!this.state.error) {
      return (
        <div className="snapshot-form-inner snapshot-modal">
          {this._version()}
          {this._changes()}
        </div>
      )
    } else {
      return this._error()
    }
  }

  _version() {
    // TODO: allow the user to select version numbers when we have a
    // system that has a point system versioning
    return (
      <div className="snapshot-version col-xs-12">
        <div className="col-xs-12">
          <h4>Snapshot Version: {this.state.selectedVersion}</h4>
        </div>
        <div className="snapshot-version-major col-xs-4">
          <label htmlFor="major" className="snapshot-version-label">
            Major
          </label>
          <input
            type="radio"
            value={this.state.major}
            onChange={this._handleVersion}
            name="version"
            title="major"
            className="snapshot-radio-button"
          />
        </div>
        <div className="snapshot-version-minor col-xs-4">
          <label htmlFor="minor" className="snapshot-version-label">
            Minor
          </label>
          <input
            type="radio"
            value={this.state.minor}
            onChange={this._handleVersion}
            name="version"
            title="minor"
            className="snapshot-radio-button"
          />
        </div>
        <div className="snapshot-version-point col-xs-4">
          <label htmlFor="patch" className="snapshot-version-label">
            Patch
          </label>
          <input
            type="radio"
            checked={
              this.state.selectedVersion == this.state.patch ? 'checked' : ''
            }
            value={this.state.patch}
            onChange={this._handleVersion}
            name="version"
            title="patch"
            className="snapshot-radio-button"
          />
        </div>
      </div>
    )
  }

  _changes() {
    let content = []
    // add an input form for a new change
    let input = (
      <div className="new-change col-xs-12" key="new-change">
        <div className="col-xs-9 form-group">
          <input
            placeholder="Enter new change here..."
            type="text"
            value={this.state.currentChange}
            onChange={this._handleChange}
            name="change"
            className="form-control"
          />
        </div>
        <div className="submit-change col-xs-3">
          <button
            className="submit btn-admin-blue add-btn"
            onClick={this._addChange}>
            <i className="fa fa-plus" />
            Add
          </button>
        </div>
      </div>
    )
    content.push(input)

    // add existing changes as list items
    this.state.changes.forEach((change, idx) => {
      let existingChange = (
        <div className="change col-xs-12" key={idx}>
          <div className="change-list-icon col-xs-1">
            <i className="fa fa-minus" />
          </div>
          <div className="change-text col-xs-8">{change}</div>
          <div className="col-xs-3 change-controls">
            <a className="" onClick={this._removeChange.bind(this, change)}>
              <i className="fa fa-times" />
              Remove
            </a>
          </div>
        </div>
      )
      content.push(existingChange)
    })
    return (
      <div className="changes col-xs-12">
        <div className="col-xs-12">
          <h4>Generate Changelog:</h4>
        </div>
        {content}
      </div>
    )
  }

  _error() {
    return (
      <div>
        <div className={this.state.error ? 'alert alert-danger' : null}>
          {this.state.error ? <h4 className="danger">Error</h4> : null}
          <h5>{this.state.message}</h5>
        </div>
      </div>
    )
  }

  submitChange() {
    let changes = this.state.changes
    if (this.state.currentChange) {
      changes.push(this.state.currentChange)
    }
    this.setState({
      changes: changes,
      currentChange: '',
    })
  }

  removeChange(change) {
    let changes = this.state.changes
    let newChanges = changes.filter(c => {
      return c !== change
    })
    this.setState({
      changes: newChanges,
    })
  }

  joinChangelogs(changesArray, oldChangelog) {
    let existingText = oldChangelog ? '\n' + oldChangelog : ''
    let dateString = moment().format('YYYY-MM-DD')
    let versionString = this.state.selectedVersion
    let headerString = versionString + '\t' + dateString + '\n\n'
    let changeText = headerString
    changesArray.forEach(change => {
      changeText += '\t- ' + change + '\n'
    })
    let newChangelog = changeText + existingText
    return newChangelog
  }

  submit() {
    let changes = this.joinChangelogs(
      this.state.changes,
      this.state.datasets.dataset.CHANGES,
    )
    actions.createSnapshot(
      changes,
      this.state.selectedVersion,
      this.props.history,
      res => {
        if (res && res.error) {
          this.setState({
            changes: [],
            error: true,
            message: res.error,
          })
        } else {
          this.props.getDataset.refetch().then(() => {
            const url = '/datasets/' + this.state.datasets.dataset.linkID
            this.props.history.push(url)
          })
        }
      },
    )
  }

  onHide() {
    this.setState({
      changes: [],
      currentChange: '',
      error: false,
      message: null,
    })
  }

  _submitButton() {
    if (!this.state.error) {
      let disabled = this.state.changes.length < 1
      let buttonTitle = disabled ? 'Please enter at least one change' : 'Submit'
      if (disabled) {
        return (
          <span className="text-danger changelog-length-warning">
            {' '}
            * Please enter at least one change to submit this snapshot{' '}
          </span>
        )
      } else {
        return (
          <button
            className="btn-modal-action"
            onClick={this.submit.bind(this)}
            title={buttonTitle}
            disabled={disabled}>
            create snapshot
          </button>
        )
      }
    }
  }

  _returnButton() {
    let buttonText = this.state.error ? 'OK' : 'Cancel'
    let btnClass = this.state.error ? 'btn-admin-blue' : 'btn-reset'
    let fromModal =
      this.props.location.state && this.props.location.state.fromModal
        ? this.props.location.state.fromModal
        : null
    let returnUrl = fromModal
      ? this.state.datasets.datasetUrl + '/' + fromModal
      : this.state.datasets.datasetUrl
    if (returnUrl) {
      return (
        <Link to={returnUrl}>
          <button className={btnClass}>{buttonText}</button>
        </Link>
      )
    } else {
      return null
    }
  }

  render() {
    let datasets = this.state.datasets
    let loading = datasets && datasets.loading
    let loadingText =
      datasets && typeof datasets.loading == 'string'
        ? datasets.loading
        : 'loading'
    let content = (
      <div className="dataset-form">
        <div className="col-xs-12 dataset-form-header">
          <div className="form-group">
            <label>Create Snapshot</label>
          </div>
          <hr className="modal-inner" />
        </div>
        <div className="dataset-form-body col-xs-12">
          <div className="dataset-form-content col-xs-12">
            {this._formContent()}
          </div>
          <div className="dataset-form-controls col-xs-12">
            {this._returnButton()}
            {this._submitButton()}
          </div>
        </div>
      </div>
    )
    return (
      <ErrorBoundary
        message="The dataset has failed to load in time. Please check your network connection."
        className="col-xs-12 dataset-inner dataset-route dataset-wrap inner-route light text-center">
        {loading ? (
          <Timeout timeout={100000}>
            <Spinner active={true} text={loadingText} />
          </Timeout>
        ) : (
          content
        )}
      </ErrorBoundary>
    )
  }
}

Snapshot.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
}

export default graphql(openneuroDatasets.getDataset, {
  name: 'getDataset',
  options: props => ({
    variables: {
      id: props.match.params.datasetId,
    },
  }),
})(withRouter(Snapshot))
