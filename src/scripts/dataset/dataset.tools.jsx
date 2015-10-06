// dependencies -------------------------------------------------------

import React        from 'react';
import Reflux       from 'reflux';
import datasetStore from './dataset.store';
import Actions      from './dataset.actions.js';
import WarnButton   from '../common/forms/warn-button.component.jsx';
import Share        from './dataset.tools.share.jsx';
import {Modal}      from 'react-bootstrap';

let Tools = React.createClass({

    mixins: [Reflux.connect(datasetStore)],

// life cycle events --------------------------------------------------

	getInitialState() {
		return {
			showModal: false
		};
	},

	componentDidMount() {
		Actions.loadUsers();
	},

	render() {
		let dataset = this.props.dataset;
		let users   = this.props.users;
		let publish;
		if (!dataset.status.uploadIncomplete) {
			publish = (
				<li role="presentation" >
					<WarnButton message="Make Public" confirm="Yes Make Public" icon="fa-eye" action={this._publish.bind(this, dataset._id)} />
	            </li>
			);
		}
		return (
			<ul className="nav nav-pills tools clearfix">
				<li role="presentation">
					<button className="btn btn-admin warning" onClick={this._downloadDataset}>Download</button>
				</li>
				{publish}
	            <li role="presentation" >
	            	<WarnButton message="Delete this dataset" action={this._deleteDataset.bind(this, dataset._id)} />
	            </li>
	            <li role="presentation" >
	            	<button className="btn btn-admin warning"  onClick={this._showModal}>Share <i className="fa fa-user-plus"></i></button>
	            </li>
	            <Modal show={this.state.showModal} onHide={this._hideModal}>
	            	<Modal.Header closeButton>
	            		<Modal.Title>Share Dataset</Modal.Title>
	            	</Modal.Header>
	            	<hr className="modal-inner" />
	            	<Modal.Body>
	            		<Share dataset={dataset} users={users} />
	            	</Modal.Body>
	            </Modal>
	        </ul>
    	);
	},

// custon methods -----------------------------------------------------

	_publish: Actions.publish,

	_deleteDataset: Actions.deleteDataset,

	_showModal() {
		this.setState({showModal: true});
	},

	_hideModal() {
		this.setState({showModal: false});
	},

	_downloadDataset: Actions.downloadDataset

});

export default Tools;