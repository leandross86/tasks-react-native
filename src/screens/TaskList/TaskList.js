import React, { Component } from 'react'
import { 
  Text, 
  View, 
  ImageBackground, 
  FlatList, 
  TouchableOpacity,
  Alert } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import AsyncStorage from '@react-native-community/async-storage'
import todayImage from '../../../assets/imgs/today.jpg'
import tomorrowImage from '../../../assets/imgs/tomorrow.jpg'
import weekImage from '../../../assets/imgs/week.jpg'
import monthImage from '../../../assets/imgs/month.jpg'
import styles from './styles'
import moment from 'moment'
import 'moment/locale/pt-br'
import Task from '../../components/Task'
import global from '../../global'
import AddTask from '../AddTask'
import axios from 'axios'
import { server, showError } from '../../common'

const initialState = {
  showDoneTasks: true,
  showModal: false,
  visibleTasks: [],
  tasks: []
}

export default class TaskList extends Component {

  state = {
    ...initialState
  }

  addTask = async newTask => {
    if(!newTask.desc || !newTask.desc.trim()) {
      Alert.alert('Dados inválidos', 'Descrição não informada!')
      return
    }

    try {
      await axios.post(`${server}/tasks`, {
        desc: newTask.desc,
        estimateAt: newTask.date
      })

      this.setState({ showModal: false }, this.loadTasks)

    } catch (e) {
      showError(e)
    }
  }

  componentDidMount = async () => {
    const stateString = await AsyncStorage.getItem('tasksState')
    const savedState = JSON.parse(stateString) || initialState
    this.setState({
      showDoneTasks: savedState.showDoneTasks
    }, this.filterTasks)

    this.loadTasks()
  }

  loadTasks = async () => {
    try {
      const maxDate = moment()
        .add({days: this.props.daysAhead})
        .format('YYYY-MM-DD 23:59:59')
      const res = await axios.get(`${server}/tasks?date=${maxDate}`)
      this.setState({ tasks: res.data }, this.filterTasks)
    } catch (e) {
      showError(e)
    }
  }

  toggleFilter = () => {
    this.setState({ showDoneTasks: !this.state.showDoneTasks }, this.filterTasks)

  }

  filterTasks = () => {
    let visibleTasks = null
    if(this.state.showDoneTasks) {
        visibleTasks = [...this.state.tasks]
    } else {
        const pending = task => task.doneAt === null
        visibleTasks = this.state.tasks.filter(pending)
    }

    this.setState({ visibleTasks })

    AsyncStorage.setItem('tasksState', JSON.stringify({
      showDoneTasks: this.state.showDoneTasks
    }))
}

  toggleTask = async taskId => {
    try {
      await axios.put(`${server}/tasks/${taskId}/toggle`)
      this.loadTasks()
    } catch (e) {
      showError(e)
    }
}

  deleteTask = async taskId => {
    try {
      await axios.delete(`${server}/tasks/${taskId}`)
      this.loadTasks()
    } catch (e) {
      showError(e)
    }
  }

  getImage = () => {
    switch(this.props.daysAhead) {
      case 0: return todayImage
      case 1: return tomorrowImage
      case 7: return weekImage
      case 30: return monthImage
    }
  }

  getColor = () => {
    switch(this.props.daysAhead) {
      case 0: return global.colors.today
      case 1: return global.colors.tomorrow
      case 7: return global.colors.week
      case 30: return global.colors.month
    }
  }

  render() {
    const today = moment().locale('pt-br').format('ddd, D [de] MMMM [de] YYYY')
    return (
      <View style={styles.container}>
        <AddTask isVisible={this.state.showModal}
          onCancel={() => this.setState({ showModal: false })}
          onSave={this.addTask}/>
        <ImageBackground source={this.getImage()} style={styles.background}>
          <View style={styles.iconBar}>
            <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
              <Icon name='bars' size={20} color={global.colors.secondary}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.toggleFilter}>
              <Icon name={ this.state.showDoneTasks ? 'eye' : 'eye-slash' } 
              size={20} color={global.colors.secondary}/>
            </TouchableOpacity>
          </View>
          <View style={styles.titleBar}>
            <Text style={styles.title}>{this.props.title}</Text>
            <Text style={styles.subtitle}>{today}</Text>
          </View>
        </ImageBackground>
        <View style={styles.taskList}>
          <FlatList data={this.state.visibleTasks}
          keyExtractor={item => `${item.id}`}
          renderItem={({item}) => <Task {...item} onToggleTask={this.toggleTask} onDelete={this.deleteTask}/> } />
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: this.getColor() }]} 
          onPress={() => this.setState({ showModal: true})} 
          activeOpacity={0.7}>
          <Icon name='plus' size={20} 
            color={global.colors.secondary} />
        </TouchableOpacity>
      </View>
    )
  }
}
