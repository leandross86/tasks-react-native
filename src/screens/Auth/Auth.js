import React, { Component } from 'react'
import { 
    Text,
    View,
    ImageBackground,
    TouchableOpacity,
    Alert } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import styles from './styles'
import backgroundImage from '../../../assets/imgs/login.jpg'
import AuthInput from '../../components/AuthInput'
import { server, showError, showSuccess } from '../../common'
import axios from 'axios'
import { CommonActions } from '@react-navigation/native'

initialState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    stageNew: false
}

export default class Auth extends Component {

    state = {
        ...initialState
    }

    signInOrSignUp = () => {
        if(this.state.stageNew) {
            this.signup()
        } else {
            this.signin()
        }
    }

    signup = async () => {
        try {
            await axios.post(`${server}/signup`, {
                name: this.state.name,
                email: this.state.email,
                password: this.state.password,
                confirmPassword: this.state.confirmPassword,
            })

            showSuccess('Usuário cadastro!')
            this.setState({ ...initialState })
        } catch(e) {
            showError(e)
        }
    }

    signin = async () => {
        try {
            const res = await axios.post(`${server}/signin`, {
                email: this.state.email,
                password: this.state.password
            })

            AsyncStorage.setItem('userData', JSON.stringify(res.data))
            axios.defaults.headers.common['Authorization'] = `bearer ${res.data.token}`
            // this.props.navigation.navigate('Home', res.data)
            this.props.navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'Home',
                            params: res.data
                        }
                    ]
                })
            )
        } catch (e) {
            showError(e)
        }
    }


    render() {

        const validations = []
        validations.push(this.state.email && this.state.email.includes('@'))
        validations.push(this.state.password && this.state.password.length >= 6)

        if(this.state.stageNew) {
            validations.push(this.state.name && this.state.name.trim().length >= 3)
            validations.push(this.state.password === this.state.confirmPassword)
        }

        const validForm = validations.reduce((t, a) => t && a)

        return (
            <ImageBackground source={backgroundImage} style={styles.background}>
                <Text style={styles.title}>Tasks</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.subtitle}>
                        {this.state.stageNew ? 'Crie sua conta' : 'Informe seus dados'}
                    </Text>
                    {this.state.stageNew && 
                        <AuthInput icon='user' placeholder='Nome' 
                        value={this.state.name} 
                        style={styles.input} 
                        onChangeText={name => this.setState({ name })}/>
                    }
                    <AuthInput icon='at' placeholder='E-mail' 
                        value={this.state.email} 
                        style={styles.input} 
                        onChangeText={email => this.setState({ email })}/>
                    <AuthInput icon='lock' placeholder='Senha' 
                        value={this.state.password} 
                        style={styles.input} 
                        secureTextEntry={true}
                        onChangeText={password => this.setState({ password })}/>
                    {this.state.stageNew && 
                        <AuthInput icon='asterisk' placeholder='Confirme a sua senha' 
                        value={this.state.confirmPassword} 
                        secureTextEntry={true}
                        style={styles.input} 
                        onChangeText={confirmPassword => this.setState({ confirmPassword })}/>
                    }
                    <TouchableOpacity onPress={this.signInOrSignUp} disabled={!validForm}>
                        <View style={[styles.button, validForm ? {} : {backgroundColor: '#AAA' }]}>
                            <Text style={styles.buttonText}>
                                {this.state.stageNew ? 'Registrar' : 'Entrar'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ padding: 10 }} 
                    onPress={ () => this.setState({ stageNew: !this.state.stageNew })}>
                    <Text style={styles.buttonText}>
                        {this.state.stageNew ? 'Já possui conta?' : 'Ainda não possui conta?'}
                    </Text>

                </TouchableOpacity>
            </ImageBackground>
        )
    }
}
