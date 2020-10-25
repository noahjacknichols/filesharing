import React from "react";
import DocumentCard from "./documentCard";
import SmallDocumentCard from "./smallDocumentCard";
import Modal from "./modal";
import ModalContent from "./modalDocContent";
import Cookies from "js-cookie";
import Filter from "./filter";
import { Container, Row, Col } from "react-bootstrap";
import { API } from "./api";

export default class DocCardContainer extends React.Component {
  constructor(props) {
    super(props);
    this.getDocInfo = this.getDocInfo.bind(this);
    this.rerenderContainer = this.rerenderContainer.bind(this);
    this.deleteCard = this.deleteCard.bind(this);
    this.insertCard = this.insertCard.bind(this);
    this.setActiveId = this.setActiveId.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.getCards = this.getCards.bind(this);
    this.onkeypressed = this.onkeypressed.bind(this);
    this.editClicked = this.editClicked.bind(this);

    this.state = {
      searchField: "",
      doc_info: [],
      user_id: Cookies.get("user_id"),
      isFetching: true, //later for loading animation
      activeId: -1,
      searchField: "",
      selectedFile: null,
      editUUID: null,
      showDocModal: false,
      cardType: "small",
    };
  }

  async componentDidMount() {
    if (Cookies.get("user_id") !== undefined) {
      this.setState({ user_id: Cookies.get("user_id") });
      try {
        await this.getDocInfo();
      } catch (error) {
        console.log(error);
      }
    }
  }

  editClicked = (uuid) => {
    console.log("editClicked");
    console.log(uuid);
    if (uuid !== undefined) {
      this.setState({ modalUUID: uuid });
      this.setState({ showDocModal: true });
    }
  };

  hideModal = () => {
    this.setState({ showDocModal: false });
  };

  handleClick = () => {
    this.hiddenFileInput.current.click();
  };

  fileSelectedHandler = (event) => {
    this.setState(
      {
        selectedFile: event.target.files[0],
      },
      () => this.fileUploadHandler()
    );
  };

  fileUploadHandler = () => {
    if (this.state.user_id !== null && this.state.selectedFile != null) {
      const data = new FormData();
      data.append("file", this.state.selectedFile);
      if (this.state.selectedFile["size"] < 16 * 1024 * 1024) {
        var url =
          API + "/documents?user=" + this.state.user_id + "&action=insert";
        fetch(url, {
          method: "POST",
          mode: "cors",
          body: data,
        })
          .then((res) => res.json())
          .then((result) => {
            this.insertCard(result);
          })
          .catch((error) => {});
      } else {
        alert("File size is too large");
      }
    }
  };

  handleChange = (event) => {
    const req = event.target.getAttribute("name");
    if (req === "searchField") {
      this.setState({ searchField: event.target.value });
    }
  };

  onkeypressed(evt) {
    var code = evt.charCode || evt.keyCode;
    if (code === 27) {
      this.setState({ searchField: "" });
      evt.target.value = "";
    }
  }

  getDocInfo() {
    var url = API + "/documents?user=" + this.state.user_id;
    fetch(url, {
      method: "GET",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((result) => {
        console.log(result);
        this.setState({ doc_info: result });
        this.setState({ isFetching: false });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  rerenderContainer() {
    this.setState({ isFetching: true });
    this.getDocInfo();
  }

  setActiveId(id) {
    if (id !== undefined) {
      this.setState({ activeId: id });
    }
  }

  insertCard = (result) => {
    if (this.state.doc_info !== null) {
      const newDocInfo = [...this.state.doc_info, result];
      this.setState({ doc_info: newDocInfo });
    } else {
      this.setState({ doc_info: [result] });
    }
  };

  deleteCard = (result) => {
    console.log(result);
    const items = [...this.state.doc_info];
    const j = items.findIndex((item) => item.doc_id === result);

    items.splice([j], 1);

    this.setState({ doc_info: items });
  };

  getCards() {
    if (this.state.searchField === "") {
      // console.log("searchfield empty")
      return this.state.doc_info;
    } else {
      var searchedCards = [];
      this.state.doc_info.map((doc) => {
        if (doc["document_name"].includes(this.state.searchField)) {
          searchedCards.push(doc);
        }
      });
      return searchedCards;
    }
  }

  handleFilter = (value) => {
    const sortedDocs = this.state.doc_info;
    sortedDocs.sort(this.dynamicSort(value));
    this.setState({ doc_info: sortedDocs });
  };

  dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }

    return function (a, b) {
      var result =
        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
      return result * sortOrder;
    };
  }

  render() {
    var modal;
    if (this.state.modalUUID !== null) {
      modal = (
        <Modal show={this.state.showDocModal} handleClose={this.hideModal}>
          {this.state.showDocModal && (
            <ModalContent
              user_id={this.state.user_id}
              uuid={this.state.modalUUID}
            />
          )}
        </Modal>
      );
    } else {
      modal = <div></div>;
    }

    var cards;
    if (
      this.state.user_id !== -1 &&
      this.state.isFetching !== true &&
      this.state.doc_info !== null
    ) {
      var filteredCards = this.getCards();
      if (filteredCards.length > 0) {
        if (this.state.cardType === "small") {
          cards = filteredCards.map((doc) => (
            <Col xs={12} sm={6} md={4} lg={4} xl={3} key={doc["uuid_id"]}>
              <SmallDocumentCard
                date={doc["date"]}
                doc_id={doc["uuid_id"]}
                name={doc["document_name"]}
                status={doc["public"]}
                path={doc["directory_loc"]}
                active={this.state.activeId}
                setActiveId={this.setActiveId}
                deleteCard={this.deleteCard}
                editClicked={this.editClicked}
              />
            </Col>
          ));
        } else {
          //full sized cards
          cards = filteredCards.map((doc) => (
            <DocumentCard
              key={doc["uuid_id"]}
              date={doc["date"]}
              doc_id={doc["uuid_id"]}
              name={doc["document_name"]}
              status={doc["public"]}
              path={doc["directory_loc"]}
              active={this.state.activeId}
              setActiveId={this.setActiveId}
              deleteCard={this.deleteCard}
              editClicked={this.editClicked}
            />
          ));
        }
      } else {
        cards = (
          <Container>
            <Row>
              <Col>
                <div className="uuidContent">
                  no documents matching search..
                </div>
              </Col>
            </Row>
          </Container>
        );
      }
    } else {
      cards = <div></div>;
    }

    const options = [
      { value: "file_name", name: "Filename" },
      { value: "date", name: "Date" },
    ];

    return (
      <Container>
        <Row>
          <Col xs={9}>
            <input
              type="text"
              className="searchBar"
              placeholder="search..."
              name="searchField"
              onKeyDown={this.onkeypressed}
              onChange={this.handleChange}
            ></input>
          </Col>
          <Col xs={2}>
            <Filter
              handleFilter={this.handleFilter}
              defaultText="Filter"
              options={options}
            />
          </Col>
        </Row>
        {modal}
        {this.state.cardType === "small" && <Row>{cards}</Row>}
        {this.state.cardType === "large" && cards}
      </Container>
    );
  }
}
