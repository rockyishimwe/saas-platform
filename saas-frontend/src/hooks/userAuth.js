import {useState,useEffect,useContext, createContext, Children} from 'react';
import{authService} from '../services/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () =>{
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth must be used with an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({children})=>{
    const [user,setUser] = useState(null);
    const [loading,setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(()=>{
        const initAuth = async() =>{
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if(token &&userData){
                try {
                    setUser(JSON.parse(userData));
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error parsing user data:',error);
                    authService.logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    },[]);
    
    const login = async(email,password)=>{
        try {
            
        } catch (error) {
            
        }
    }
}