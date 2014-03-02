/** @jsx React.DOM */
var ActionTags = React.createClass({
  render: function(){
    var tags = this.props.tags;
    if(!tags || tags.length <= 0){
      return <div className='noteTags'/>; // jshint ignore:line
    }
    /*jshint ignore:start */
    return (
      <div className='noteTags'>
      {tags}
      </div>
    );
    /*jshint ignore:end */
  }
});

var Action = React.createClass({
  render: function(){
    var content = this.props.content;
    if(!content || content.length <= 0){
      content = 'NO DATA';
    }
    /*jshint ignore:start */
    return (
      <div>
        <h1>{this.props.title}</h1>
      	<ActionTags tags={this.props.tags}/>
        <pre>{content}</pre>
      </div>
    );
    /*jshint ignore:end */
  }
});

var ActionList = React.createClass({
  render: function(){
    /*jshint ignore:start */
    var actionNotes = this.props.data.map(function(action, index){
      return <Action key={index} title={action.title} content={action.content} tags={action.tags}/>;
    });
    return <div className='actionList'>{actionNotes}</div>;
    /*jshint ignore:end */
  }
});

var Actions = React.createClass({
  loadActionsFromServer: function(){
    $.ajax({
      url: this.props.url,
      success: function(d){
        if(this.isMounted()){
          this.setState({data: d});
        }
      }.bind(this)
    });
  },
  getInitialState: function(){
    return {data: []};
  },
  componentWillMount: function(){
    this.loadActionsFromServer();
  },
  render: function(){

    /*jshint ignore:start */
    return (
      <div id='actions'>
        <ActionList data={this.state.data}/>
      </div>
    );
    /*jshint ignore:end */
  }
});

React.renderComponent(
  /*jshint ignore:start */
  <Actions url='/tasks/nextActions.json'/>,
  document.getElementById('mcontainer')
  /*jshint ignore:end */
);
