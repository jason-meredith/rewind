import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            search: "",
            results: [],
            typeFilterOptions: [],
            typeFilters: [],
            ready: false
        };

        this.search = this.search.bind(this);
        this.details = this.details.bind(this);
        this.toggleModal = this.toggleModal.bind(this);

        // Get the Pokemon types
        let xhr = new XMLHttpRequest();
        let app = this;
        xhr.onreadystatechange = function () {
            if(this.readyState === 4 && this.status === 200) {
                let types = JSON.parse(xhr.responseText).types;
                app.setState({typeFilterOptions: types });
            }
        };
        xhr.open("GET", "https://api.pokemontcg.io/v1/types" + this.state.search, true);
        xhr.send();

    }


    // Create and send the AJAX request to a given URL
    search(url, queryLength) {
        this.setState({queryLength: queryLength});

        // Make AJAX request to Pokemon API
        let xhr = new XMLHttpRequest();
        let app = this;
        xhr.onreadystatechange = function () {

            // If the request is sent and successful, but the data is still loading
            if(this.readyState === 3 && this.status === 200) {
                app.setState({
                    ready: false
                });
            }

            // Data is loaded
            if(this.readyState === 4 && this.status === 200) {

                // Get all card results
                let cards = JSON.parse(xhr.responseText).cards;
                app.setState({
                    results: cards,
                    ready: true
                });
            }
        };
        xhr.open("GET", url, true);
        xhr.send()
    }

    details(info) {
        this.setState({info: info})
    }


    // Toggle whether or not the InfoModal gets rendered
    toggleModal() {
        this.setState({
            modalVisible: !this.state.modalVisible
        });
    }

    render() {
        return(
            <div >
                <div className="container-fluid">
                    <h1>Rewind.io Pokemon Test</h1>
                    <SearchBar typeFilterOptions={this.state.typeFilterOptions} setFilterOptions={this.state.setFilterOptions} search={this.search} />
                    <SearchResults toggleModal={this.toggleModal} info={this.details} results={this.state.results} search={this.state.search} queryLength={this.state.queryLength} ready={this.state.ready}/>
                </div>

                <InfoModal toggleModal={this.toggleModal} info={this.state.info} modalVisible={this.state.modalVisible} />
            </div>
        );
    }
}

/**
 * The grid of Pokemon cards rendered when a search returns results
 */
class SearchResults extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            info: {}
        };

        this.toggleModal = this.toggleModal.bind(this);
    }

    toggleModal(cardId) {
        this.props.info(this.props.results[cardId]);
        this.props.toggleModal();
    }

    render() {
        if(this.props.queryLength > 0 && this.props.ready === false) {
            return (<h3>Loading...</h3>)
        } else if(this.props.queryLength === 0) {
            return (<h3></h3>)
        } else if(this.props.results.length === 0 && this.props.queryLength > 0) {
            return (<h3>No Results Found!</h3>)
        }

        return (<div className="grid">{this.props.results.map((stats, i) => <Card key={i} id={i} click={this.toggleModal} info={this.info} stats={stats}/>)}</div>)
    }
}

/**
 * The top level search bar consisting of the text input and the type-filter checkbox dropdown
 */
class SearchBar extends React.Component {
    constructor(props) {
        super(props);

        this.inputChange = this.inputChange.bind(this);
        this.typeFilterChange = this.typeFilterChange.bind(this);

        this.state = {
            search: "",
            typeFilters: [],
            setFilters: []
        }
    }

    // When the user types in the search bar, update state and run Search
    inputChange(e) {
        this.setState({search:e.target.value}, this.search)
    }

    // When te user clicks a type filter checkbox, update state and run Search
    typeFilterChange(e) {
        let filters = this.state.typeFilters;

        if(this.state.typeFilters.indexOf(e.target.value) === -1) {
            filters.push(e.target.value)
        } else {
            filters.splice(this.state.typeFilters.indexOf(e.target.value), 1)
        }
        this.setState({typeFilters: filters}, this.search)

    }

    // Build a search query url string and pass upward to App component
    search() {
        let url = "https://api.pokemontcg.io/v1/cards?name=" + this.state.search;

        if(this.state.typeFilters.length > 0) {
            url += "&types=" + this.state.typeFilters.join(",")
        }

        this.props.search(url, this.state.search.length)
    }

    render() {
        return (
            <div className="searchBar">
                <input placeholder="Start typing to search..." className="form-control" type = "text" value = {this.state.search} onChange={this.inputChange} />
                <br/>
                <TypeFilterSelection options={this.props.typeFilterOptions} onFilterChange={this.typeFilterChange}/>
            </div>
        );
    }
}

/**
 * A drop-down box of Pokemon-type checkboxes
 */
class TypeFilterSelection extends React.Component {

    render() {
        return (
            <div className="dropdown float-right">
                <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                        data-toggle="dropdown">Type Filter</button>
                <div className="dropdown-menu">
                    {this.props.options.map((value, i) => (
                        <div className="dropdown-item" key={i}>
                            <div className="checkbox">
                                <label>
                                    <input
                                        onChange={(e) => this.props.onFilterChange(e)}
                                        type='checkbox'
                                        value={value}
                                    />
                                    {value}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}



/**
 * A Pokemon card in the Search Result grid
 */
class Card extends React.Component {

    constructor(props) {
        super(props);

        this.click = this.click.bind(this);
    }

    click() {
        this.props.click(this.props.id)
    }

    render() {
        return (
            <div className="card" onClick={this.click}>
            <img src={this.props.stats.imageUrl} />
            </div>
        );
    }

}

/**
 * Modal to display additional information about a clicked Pokemon card
 */
class InfoModal extends React.Component {


    render() {

        let styles = this.props.modalVisible ? { display: "block" } : { display: "none" };

        // Default values so the modal can be built before a card is mousedOver
        let info = {};
        if(this.props.info == null) {
            info = {
                name: "",
                types: [""],
                set: "",
                series: "",
                rarity: "",
                artist: ""
            }
        } else {
            info = this.props.info
        }

        return (

            <div id="infoModal" className="modal" role="dialog" style={styles} >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">{info.name}</h5>
                            <button type="button"
                                    onClick={this.props.toggleModal} className="close" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <table >
                                <tbody>
                                    <tr><th>Type(s)</th><td>{info.types}</td></tr>
                                    <tr><th>Set</th><td>{info.set}</td></tr>
                                    <tr><th>Series</th><td>{info.series}</td></tr>
                                    <tr><th>Rarity</th><td>{info.rarity}</td></tr>
                                    <tr><th>Artist</th><td>{info.artist}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button onClick={this.props.toggleModal} type="button" className="btn btn-default">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )

    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);