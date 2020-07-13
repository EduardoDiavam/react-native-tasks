import React, {Component} from 'react'
import { View, Text, ImageBackground, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import Icon from 'react-native-vector-icons/FontAwesome'
import todayImage from '../../assets/assets/imgs/today.jpg'
import commonStyles from '../commonStyles'
import moment from 'moment'
import 'moment/locale/pt-br'
import Task from '../components/Task'
import AddTask from './AddTask'

//Todo o dado que precisa ser alterado dentro da aplicação colamos no state, aqui definimps um state inicial vazio
const initialState = {    
    //Mostrar tarefas concluidas     
    showDoneTasks: true,
    //Tarefas visiveis para aplicar o filtro de tarefas visiveis
    visibleTasks: [],
    //Mostrar modal de adicionar uma tarefa
    showAddTask: false,
    // Array com todas as nossas tarefas
    tasks: []
}


export default class TaskList extends Component {
    // Usamos os 3 pontos para pegar todo o objeto initialState que controlara o ciclo de vida de nossos componentes
    state = {
        ...initialState
    }
    // Este é invocado imediatamente após um componente ser montado, usamos async para poder usar o await
    componentDidMount = async () => {
        // Constate para pegar o valor gravado do AsyncStorage com a sua key 
        const stateString = await AsyncStorage.getItem('taskState')
        // Convertendo o valor para um JSON, o operador || é usado se acaso ele não conseguir converter ele vai receber o valor vazio de initialState
        const state = JSON.parse(stateString) || initialState
        //Aqui setamos o valor do estado que vem do state e chamamos uma callback para aplicar o filtro de tarefas concluidas
        this.setState(state, this.filterTasks)     
    }
    // Método alteranio de true e false para o botão de mostrar tarefas concluidas
    toggleFilter = () => {
        //Aqui setamos o estado do showDoneTasks alternadamente com ! para true ou false e chamaos o filtro de tarefas concluidas 
        this.setState({ showDoneTasks: !this.state.showDoneTasks}, this.filterTasks)
    }
    // Função para filtrar as tarefas concluidas
    filterTasks = () => {
        //Variavel visibleTasks recebe o valor null
        let visibleTasks = null
        // Se o estado do showDoneTasks for true  o array visibleTasks setado no estado recebe todas as tarefas
        if(this.state.showDoneTasks) {
            visibleTasks = [...this.state.tasks]
        } else {
            // Se não, definimos uma constante que recebe uma task, se o valor do campo doneTask for null, ou seja que a tarefa não foi concluida
            const pending = task => task.doneAt === null
            //Adicionamos somente as tasks pendentes ao visibleTask com this.state somente os elementos que estão na tela vão ser adicionados
            //apoś serem filtrados com a variavel dessa verificação
            visibleTasks = this.state.tasks.filter(pending)
        }
        // Aqui estamos alterando o estado do visibleTasks conforme o filtro acima
        this.setState({visibleTasks})
        // Gravando no asyncstorage com uma key e convertendo para string  o estado atual
        AsyncStorage.setItem('taskState', JSON.stringify(this.state))
    }
    // Funcão para ao clicar na tarefas ela for concluida ou não, que espera receber um taskId para saber qual task foi clicada na tela
    toggleTask = taskId => {
        // Definimos uma contante que recebe o estado de tasks
        const tasks = [...this.state.tasks]
        // Dentro dessa função procuramos o campo id e verificamos se é estritamente igual ao id da task que foi clicada
        // que esperamos do retorno da função
        tasks.forEach(task => {
            if(task.id === taskId) {
                // Se for igual o campo doneAt (se a tarefa foi concluida)  vai ser feita uma verificação
                // Se acaso o DoneAt for null, ou seja que a tarefa não foi concluida ela vai receber a data atual e ficara concluida
                task.doneAt = task.doneAt ? null : new Date()
            }
        })
        // Aqui setamos o estado alterado  e chamaos uma callback para aplicar o filtro
        this.setState({tasks}, this.filterTasks)
    }
    // funcão para adicionar uma task que espera receber uma newTask
    addTask = newTask => {
        // Verificação se o campo descrição estiver null ou ter apenas espaços mandaremos um alerta que o campo precisa ser preenchido
        if(!newTask.desc || !newTask.desc.trim()) {
            Alert.alert('Dados Inválidos', 'Descrição não informada')
            return
        }
        // Constante tasks que recebe o estado do array tasks
        const tasks = [...this.state.tasks]
        // Aqui pegamos as informações do tasks que serão enviadas do Modal de uma NovaTask 
        tasks.push({
            id: Math.random(),
            desc: newTask.desc,
            estimateAt: newTask.date,
            doneAt: null
        })
        // E setamos o estado da tasks com a nova task e fechamos o modal de showAddTask e aplicamos o filterTasks como callback
        this.setState({tasks, showAddTask: false}, this.filterTasks)
    }
    // Funcão para exluir uma task que espera receber um id
    deleteTask = id => {
        // Definimos uma constante que recebe todas as tasks e filtra o id da task é diferente de todas as que tem
        const tasks = this.state.tasks.filter(task => task.id !== id)
        //Aqui setamos o estado com todas que forem diferentes, ou seja excluimos a task com o id clicado e chamamos o filtro de callback
        this.setState({tasks}, this.filterTasks)
    }
    render() {
        const today = moment().locale('pt-br').format('ddd, D [de] MMMM')
        return (
            <View style={styles.container}>
                <AddTask onSave={this.addTask} isVisible={this.state.showAddTask} onCancel={() => this.setState({showAddTask: false})}/>
                <ImageBackground style={styles.background} source={todayImage}>
                    <View style={styles.iconBar}>
                        <TouchableOpacity onPress={this.toggleFilter}>
                            <Icon size={20} color={commonStyles.colors.secondary} name={this.state.showDoneTasks ? 'eye' : 'eye-slash'} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.titleBar}></View>         
                </ImageBackground>
                <View style={styles.taskList}>
                    <FlatList
                        data={this.state.visibleTasks}
                        keyExtractor={item => `${item.id}`}
                        renderItem={({item}) => <Task {...item} onToggleTask={this.toggleTask} onDelete={this.deleteTask}/>}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => this.setState({showAddTask: true})}
                    activeOpacity={0.7}>
                        <Icon name="plus" size={20} color={commonStyles.colors.secondary}></Icon>
                </TouchableOpacity>
            </View>

        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    background: {
        flex: 3
    },
    taskList: {
        flex: 7
    },
    titleBar: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    title: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 50,
        marginLeft: 20,
        marginBottom: 20
    },
    subtitle: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 20,
        marginLeft: 20,
        marginLeft: 30
    },
    iconBar: {
        flexDirection: "row",
        marginHorizontal: 20,
        justifyContent: 'flex-end',
        marginTop: Platform.OS === 'ios' ? 40 : 10
    },
    addButton: {
        position: "absolute",
        right: 30,
        bottom: 30,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: commonStyles.colors.today,
        justifyContent: "center",
        alignItems: "center"
    }

})