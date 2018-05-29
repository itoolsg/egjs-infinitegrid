import React, {Component} from "react";
import ReactDOM from "react-dom";
import {GridLayout} from "../../src/index";


class Item extends Component {
	render() {
		const no = this.props.num;
		const text = `egjs ${no}`;

		return (<div className="item" onClick={this.props.onClick}>
			<div className="thumbnail">
				<img src={`https://naver.github.io/egjs-infinitegrid/assets/image/${no % 59 + 1}.jpg`}/>
			</div>
			<div className="info">
				{text}
			</div>
		</div>);
	}
}

class App extends Component {
	constructor(prop) {
		super(prop);
		this.loading = (<div className="loading">Loading...</div>);
		this.start = 0;
		this.state = {
			loading: this.loading,
			list: this.loadItems(0),
		};
	}
	loadItems(groupKey) {
		const items = [];
		const start = this.start || 0;

		for (let i = 0; i < 20; ++i) {
			items.push(<Item groupKey={groupKey} num={1 + start + i} key={start + i}
				onClick={(itemKey => (e => this.remove(itemKey)))(start + i)}/>);
		}
		this.start = start + 20;
		return items;
	}
	remove(itemKey) {
		const list = this.state.list.slice();
		const index = list.map(component => parseFloat(component.key)).indexOf(itemKey);

		// console.log(itemKey, index);
		list.splice(index, 1);
		this.setState({list});
	}
	onAppend = ({groupKey}) => {
		const list = this.state.list;
		const items = this.loadItems(groupKey + 1);

		this.setState({loading: true, list: list.concat(items)});
	}
	onLayoutComplete = ({isLayout}) => {
		window.b = this;
		!isLayout && this.setState({loading: false});
	}
	render() {
		const {list} = this.state;

		return (
			<GridLayout margin={10}
				align={"center"}
				onAppend={this.onAppend}
				isConstantSize={true}
				onLayoutComplete={this.onLayoutComplete}
				loading = {this.state.loading}
			>
				{list}
			</GridLayout>
		);
	}
}

ReactDOM.render(<App />, document.getElementById("__react-content"));

